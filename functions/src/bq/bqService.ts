import {BigQuery} from "@google-cloud/bigquery";
import {userDetails} from "../types";

const bq = new BigQuery();

const PROJECT_ID = "study-group-finder-448404";
const DATASET = "live";
enum Tables {
  COURSES = "courses",
  JOIN = "join_event",
  GROUPS = "study_groups",
  USER = "user",
}

export const logJoinEvent = async (isJoinEvent: boolean, email: string,
  groupId: string) => {
  const tstamp = new Date().toISOString();
  const row = {
    email: email,
    group_id: groupId,
    is_creation_event: false,
    is_leave_event: !isJoinEvent,
    event_date: tstamp,
  };
  bq.dataset(DATASET).table(Tables.JOIN).insert(row);
};
const generateUserSetClause = (filteredUpdates: any): string => {
  const setClauses = Object.entries(filteredUpdates).map(([key]) => {
    return `${key} = @${key}`;
  });
  return setClauses.join(", ");
};

export const logUpdateUserEvent = async (user: userDetails) => {
  const filteredUpdates = Object.fromEntries(
    Object.entries(user).filter(([, value]) => value !== null)
  );
  const userExistsQuery = `
  select 1 
  from \`${PROJECT_ID}.${DATASET}.${Tables.USER}\` 
  where email = @email
  `;
  const userExistsOptions = {
    query: userExistsQuery,
    params: {email: user.email},
  };

  const [rows] = await bq.query(userExistsOptions);
  const updateUserParams = {
    ...filteredUpdates,
    email: user.email,
  };
  if (rows.length > 0) {
    const setClause = generateUserSetClause(filteredUpdates);
    const updateUserQuery = `
    update \`${PROJECT_ID}.${DATASET}.${Tables.USER}\`
    set ${setClause}
    where email = @email
    `;
    const updateUserOptions = {
      query: updateUserQuery,
      params: updateUserParams,
    };
    await bq.query(updateUserOptions);
  } else {
    const tstamp = new Date().toISOString();
    const row = {
      email: filteredUpdates.email,
      first_name: user.firstName,
      last_name: user.lastName,
      majors: user.majors,
      year: user.year,
      join_date: tstamp,
    };
    await bq.dataset(DATASET).table(Tables.USER).insert(row);
  }
};
