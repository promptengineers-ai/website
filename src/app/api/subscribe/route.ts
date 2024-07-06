import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const API_TOKEN = process.env.BREVO_API_KEY || '';
  const URL = "https://api.brevo.com/v3/contacts";
  const body = await request.json();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "api-key": API_TOKEN,
  };
  try {
    // Forward the request to Airtable
    const response = await fetch(URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ ...body, listIds: [9], updateEnabled: false }),
    });

    if (!response.ok) {
      // Handles Airtable API errors
      const errorData = await response.json();
      console.log(errorData);
      return new Response(errorData, {
        status: 500,
      });
    }

    // Forward the successful response from Airtable to the client
    const data = await response.json();
    console.log(
      JSON.stringify({ ...body, listIds: [9], updateEnabled: false }),
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // Handles fetch errors
    console.log(error)
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 },
    );
  }
}
