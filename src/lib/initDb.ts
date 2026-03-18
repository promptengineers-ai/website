import { createUserIndexes } from "./models/User";
import { createProfileIndexes } from "./models/Profile";
import { createHackathonIndexes } from "./models/Hackathon";
import { createHackathonTeamIndexes } from "./models/HackathonTeam";
import { createHackathonRegistrationIndexes } from "./models/HackathonRegistration";
import { createMagicLinkTokenIndexes } from "./models/MagicLinkToken";

export async function initializeDatabase() {
  try {
    await createUserIndexes();
    await createProfileIndexes();
    await createHackathonIndexes();
    await createHackathonTeamIndexes();
    await createHackathonRegistrationIndexes();
    await createMagicLinkTokenIndexes();
    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating database indexes:", error);
    throw error;
  }
}
