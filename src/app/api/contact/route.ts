import { NextResponse } from "next/server";

export async function POST(request: Request) {

  const API_TOKEN = process.env.AIRTABLE_API_KEY;
  const URL = "https://api.airtable.com/v0/app6sU4AprV9uZze6/Contacts";
  const body = await request.json();
  delete body.Message; // If to Prompt Engineers AI contact list.
  try {
    // Forward the request to Airtable
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({fields: body}),
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
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    // Handles fetch errors
    return NextResponse.json(
      { error: "Failed to connect Submit" },
      { status: 500 },
    );
  }
}