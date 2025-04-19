import {CloudTasksClient} from "@google-cloud/tasks";

const projectId = "study-group-finder-448404";
const location = "us-east4";
const queue = "reminderEmails";
const functionURL = "https://sendemail-jmpi7y54bq-uc.a.run.app";

export const createCloudTask = async (groupID: string, tstamp: number) => {
  const client = new CloudTasksClient();
  const parent = client.queuePath(projectId, location, queue);
  const currentSeconds = Math.floor(Date.now() / 1000);
  const meetingInSeconds = Math.floor(tstamp / 1000);
  const oneHourInSeconds = 60 * 60;
  const seconds = Math.max(currentSeconds, meetingInSeconds - oneHourInSeconds);
  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: functionURL,
      headers: {"Content-Type": "application/json"},
      body: Buffer.from(JSON.stringify({groupID: groupID})).toString("base64"),
    },
    scheduleTime: {
      seconds: seconds,
    },
  };
  try {
    const [response] = await client.createTask({parent, task});
    console.log("Task created:", response.name);
  } catch (error) {
    console.error("Error creating task:", error);
  }
};
