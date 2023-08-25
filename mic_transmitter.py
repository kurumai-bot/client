import asyncio
import logging
import math
from queue import Empty, Queue
import pyaudio
from websockets.client import connect, WebSocketClientProtocol


class MicTransmitter:
    def __init__(
            self,
            input_device_index=0,
            chunk_length=0.5,
            max_mic_queue_length = 10) -> None:
        self.logger = logging.getLogger("transmitter")

        # Start PyAudio
        self.chunk_length = chunk_length
        self.chunk_size = math.ceil(self.chunk_length * 16_000)
        audio = pyaudio.PyAudio()
        self.stream = audio.open(
            format=pyaudio.paFloat32,
            channels=1,
            rate=16_000,
            input=True,
            output=False,
            frames_per_buffer=self.chunk_size,
            input_device_index=input_device_index,
            stream_callback=self._mic_callback
        )
        self.mic_queue = Queue(max_mic_queue_length)

        self.websocket: WebSocketClientProtocol = None
        self.consumer_task: asyncio.Future = None
        self.producer_task: asyncio.Future = None

    async def start(self):
        while True:
            try:
                # Start websocket connection
                async with connect("ws://localhost:8001/") as websocket:
                    self.websocket = websocket
                    # Start handlers
                    loop = asyncio.get_event_loop()
                    self.consumer_task = loop.create_task(self._consumer())
                    self.producer_task = loop.create_task(self._producer())

                    # Can ignore completed handler task
                    (_, pending_tasks) = await asyncio.wait([
                        self.consumer_task,
                        self.producer_task
                    ], return_when=asyncio.FIRST_COMPLETED)

                    for pending_task in pending_tasks:
                        pending_task.cancel()
            except ConnectionRefusedError:
                # Called when server is closed. Keep trying to reconnect.
                self.logger.error("Connection refused. Attempting to reconnect.")

    async def stop(self):
        if self.consumer_task:
            self.consumer_task.cancel()
        if self.producer_task:
            self.producer_task.cancel()
        if self.websocket:
            await self.websocket.close()

    async def _consumer(self):
        async for message in self.websocket:
            self.logger.info(message)

    async def _producer(self):
        while True:
            try:
                # Don't block, use asyncio.sleep instead
                mic_data = self.mic_queue.get_nowait()
                await self.websocket.send(mic_data)
            except Empty:
                await asyncio.sleep(0.1)

    def _mic_callback(self, in_data, *_):
        self.mic_queue.put(in_data)

        return None, pyaudio.paContinue


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        force=True, 
        format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
    )

    pa = pyaudio.PyAudio()
    for index in range(pa.get_device_count()):
        if pa.get_device_info_by_index(index)["maxInputChannels"]:
            print(f"{index}: {pa.get_device_info_by_index(index)['name']}")

    transmitter = MicTransmitter(input_device_index=int(input("Select index: ")))
    try:
        asyncio.run(transmitter.start())
    except KeyboardInterrupt:
        asyncio.run(transmitter.stop())
