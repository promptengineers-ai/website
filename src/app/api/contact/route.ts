import { NextResponse } from "next/server";
import AirtableApi from "../utils/airtable";
import BrevoApi from "../utils/brevo";

export async function POST(request: Request) {
  try {
    const airtable = new AirtableApi();
    const brevo = new BrevoApi();
    const body = await request.json();
    const airRes = await airtable.create(body);
    const brevoRes = await brevo.subscribe(body);

    if (!airRes.ok) {
      // Handles Airtable API errors
      const errorData = await airRes.json();
      console.log(errorData);
      return new Response(errorData, {
        status: 500,
      });
    }

    if (!brevoRes.ok) {
      // Handles Airtable API errors
      const errorData = await brevoRes.json();
      console.error(errorData);
      return new Response(errorData, {
        status: 500,
      });
    }

    // Forward the successful response from Airtable to the client
    const data = {
      ...(await airRes.json()),
      ...(await brevoRes.json()),
    };
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // Handles fetch errors
    return NextResponse.json(
      { error: "Failed to subscribe" }, 
      { status: 500 }
    );
  }
}