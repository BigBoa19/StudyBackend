import {CloudTasksClient} from "@google-cloud/tasks";


const projectId = "study-group-finder-448404";
const location = "us-east4";
const queue = "reminderEmails";
const functionURL = "https://sendemail-jmpi7y54bq-uc.a.run.app";

export const createCloudTask = async (groupID: string, timestamp: number) => {
  const client = new CloudTasksClient();
  const parent = client.queuePath(projectId, location, queue);
  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: functionURL,
      headers: {"Content-Type": "application/json"},
      body: Buffer.from(JSON.stringify({groupID: groupID})).toString("base64"),
    },
    scheduleTime: {
      seconds: Math.floor(timestamp / 1000),
    },
  };
  try {
    const [response] = await client.createTask({parent, task});
    console.log("Task created:", response.name);
  } catch (error) {
    console.error("Error creating task:", error);
  }
};
