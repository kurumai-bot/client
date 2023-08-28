export default class GenericEvent<T> extends Event {
  data: T;

  constructor(type: string, data: T, eventInitDict?: EventInit) {
    super(type, eventInitDict);

    this.data = data;
  }
}

// A class whose generic is a map that maps an event type name to an event.
export class GenericEventTarget<ThisType, Map extends Record<string, Event>> extends EventTarget {
  addEventListener<K extends keyof Map>(type: K, listener: null | ((this: ThisType, ev: Map[K]) => any) | { handleEvent(this: ThisType, ev: Map[K]): any }, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
    super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof Map>(type: K, listener: null | ((this: ThisType, ev: Map[K]) => any) | { handleEvent(this: ThisType, ev: Map[K]): any }, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
    super.removeEventListener(type, listener, options);
  }
}