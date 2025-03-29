import { CloudTasksClient } from "@google-cloud/tasks";

const projectId = "study-group-finder-448404";
const location = "us-east4";
const queue = "reminderEmails";
const functionURL = "TBD";

export const createCloudTask = async () => {
    const client = new CloudTasksClient();
    const parent = client.queuePath(projectId, location, queue);
    const task = {
        httpRequest: {
            httpMethod: "POST" as "POST",
            url: functionURL,
            headers: {"Content-Type": "application/json"},
            body: Buffer.from(JSON.stringify({message: "Hello"})).toString("base64")
        },
        scheduleTime: {
            seconds: Math.floor(Date.now() / 1000) + 60,
          },
    }
    try {
        const [response] = await client.createTask({ parent, task });
        console.log("Task created:", response.name);
      } catch (error) {
        console.error("Error creating task:", error);
      }
}