// Backend utility to update user preferences for auto-booking
const db = require("../db/models");
const User = db.user;
const logger = require("./logger");

// Map of day names to numbers (0=Sunday, 1=Monday, etc.)
const dayMap = {
  "Sunday": 0,
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4,
  "Friday": 5,
  "Saturday": 6
};

// User preferences data
const userPreferences = [
  { username: "Amit", days: ["Monday", "Tuesday", "Wednesday"], requiredDays: 3 },
  { username: "Anand", days: ["Monday", "Friday"], requiredDays: 2 },
  { username: "Arjun", days: ["Tuesday", "Friday"], requiredDays: 2 },
  { username: "Hemanth", days: ["Monday", "Thursday"], requiredDays: 2 },
  { username: "Muthukumar", days: ["Wednesday", "Thursday"], requiredDays: 2 },
  { username: "Muthu", days: ["Monday", "Thursday"], requiredDays: 2 }, // Added Muthu based on admin settings
  { username: "Prashi", days: ["Tuesday", "Wednesday"], requiredDays: 2 },
  { username: "Rishu", days: ["Tuesday", "Thursday"], requiredDays: 2 },
  { username: "Roshan", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], requiredDays: 5 },
  { username: "Sagar", days: ["Wednesday", "Friday"], requiredDays: 2 },
  { username: "Sarath", days: ["Thursday", "Friday"], requiredDays: 2 },
  { username: "Shejo", days: ["Monday", "Wednesday"], requiredDays: 2 },
  { username: "Sreelekshmi", days: ["Monday", "Thursday"], requiredDays: 2 },
  { username: "Sreeram", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], requiredDays: 5 },
  { username: "Sukesh", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], requiredDays: 4 },
  { username: "Vinod", days: ["Monday", "Friday"], requiredDays: 2 },
  { username: "Sravani", days: ["Thursday", "Friday"], requiredDays: 2 }
];

/**
 * Update all user preferences in the database
 */
async function updateAllUserPreferences() {
  try {
    logger.info("Starting to update user preferences");
    let updatedCount = 0;
    let failedCount = 0;
    
    for (const pref of userPreferences) {
      try {
        // Convert day names to day numbers
        const dayNumbers = pref.days.map(day => dayMap[day]);
        
        // Find the user
        const user = await User.findOne({
          where: {
            username: {
              [db.Sequelize.Op.iLike]: pref.username // Case-insensitive search
            }
          }
        });
        
        if (!user) {
          logger.warn(`User ${pref.username} not found in the database`);
          failedCount++;
          continue;
        }
        
        // Update the user's preferences
        await user.update({
          defaultWorkDays: dayNumbers,
          requiredDaysPerWeek: pref.requiredDays
        });
        
        logger.info(`Updated preferences for user ${pref.username}: days=${JSON.stringify(dayNumbers)}, required=${pref.requiredDays}`);
        updatedCount++;
      } catch (userError) {
        logger.error(`Failed to update preferences for user ${pref.username}:`, userError);
        failedCount++;
      }
    }
    
    logger.info(`User preference update complete: ${updatedCount} updated, ${failedCount} failed`);
    return { updatedCount, failedCount };
  } catch (error) {
    logger.error("Failed to update user preferences:", error);
    throw error;
  }
}

module.exports = {
  updateAllUserPreferences
};