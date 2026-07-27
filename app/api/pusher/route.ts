import { NextResponse } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID || process.env.PUSHER_APP_ID || "",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || "us2",
  useTLS: true,
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const hasCreds = (process.env.NEXT_PUBLIC_PUSHER_APP_ID || process.env.PUSHER_APP_ID) && 
                     (process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY) && 
                     process.env.PUSHER_SECRET;
                     
    if (!hasCreds) {
      console.error("[Pusher API] Missing Pusher credentials in environment variables.");
      return NextResponse.json({ error: "Pusher credentials not configured" }, { status: 500 });
    }

    // Broadcast the state update to the public "classroom-sync" channel
    await pusher.trigger("classroom-sync", "state-update", data);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Pusher API Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
