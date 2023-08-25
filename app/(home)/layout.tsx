import Image from "next/image";
import dynamic from "next/dynamic";

const ClientProvider = dynamic(() => import("@/components/ClientProvider"), { ssr: false });

export default function Layout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ClientProvider>
      <nav className="border-b border-[color:rgb(var(--secondary-rgb))] h-[--header-height]">
        <div className="float-right h-full flex items-center">
          <Image
            src="/pfp-placeholder.png"
            width={64}
            height={64}
            alt="profile picture"
            className="h-full w-auto p-2.5 rounded-full"
          />
        </div>
      </nav>
      {children}
    </ClientProvider>
  );
}