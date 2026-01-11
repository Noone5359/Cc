import {
  ConnectorConfig,
  DataConnect,
  OperationOptions,
  ExecuteOperationResponse,
} from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;

export interface Assignment_Key {
  id: UUIDString;
  __typename?: 'Assignment_Key';
}

export interface Course_Key {
  id: UUIDString;
  __typename?: 'Course_Key';
}

export interface CreateNewEventData {
  event_insert: Event_Key;
}

export interface CreateNewEventVariables {
  category?: string | null;
  dateTime: TimestampString;
  description?: string | null;
  location: string;
  organizer?: string | null;
  title: string;
}

export interface EnrollUserInCourseData {
  enrollment_insert: Enrollment_Key;
}

export interface EnrollUserInCourseVariables {
  courseId: UUIDString;
  userId: UUIDString;
}

export interface Enrollment_Key {
  id: UUIDString;
  __typename?: 'Enrollment_Key';
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface GroupMembership_Key {
  id: UUIDString;
  __typename?: 'GroupMembership_Key';
}

export interface Group_Key {
  id: UUIDString;
  __typename?: 'Group_Key';
}

export interface ListCoursesForUserData {
  user?: {
    enrollments_on_user: {
      course: {
        id: UUIDString;
        courseCode: string;
        title: string;
        description?: string | null;
        instructorName?: string | null;
        semester: string;
        year: number;
      } & Course_Key;
    }[];
  };
}

export interface ListCoursesForUserVariables {
  userId: UUIDString;
}

export interface ListPublicEventsData {
  events: ({
    id: UUIDString;
    title: string;
    description?: string | null;
    dateTime: TimestampString;
    location: string;
    organizer?: string | null;
  } & Event_Key)[];
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateNewEvent' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewEvent(
  dc: DataConnect,
  vars: CreateNewEventVariables,
  options?: OperationOptions
): Promise<ExecuteOperationResponse<CreateNewEventData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewEvent' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewEvent(
  vars: CreateNewEventVariables,
  options?: OperationOptions
): Promise<ExecuteOperationResponse<CreateNewEventData>>;

/** Generated Node Admin SDK operation action function for the 'ListPublicEvents' Query. Allow users to execute without passing in DataConnect. */
export function listPublicEvents(
  dc: DataConnect,
  options?: OperationOptions
): Promise<ExecuteOperationResponse<ListPublicEventsData>>;
/** Generated Node Admin SDK operation action function for the 'ListPublicEvents' Query. Allow users to pass in custom DataConnect instances. */
export function listPublicEvents(
  options?: OperationOptions
): Promise<ExecuteOperationResponse<ListPublicEventsData>>;

/** Generated Node Admin SDK operation action function for the 'EnrollUserInCourse' Mutation. Allow users to execute without passing in DataConnect. */
export function enrollUserInCourse(
  dc: DataConnect,
  vars: EnrollUserInCourseVariables,
  options?: OperationOptions
): Promise<ExecuteOperationResponse<EnrollUserInCourseData>>;
/** Generated Node Admin SDK operation action function for the 'EnrollUserInCourse' Mutation. Allow users to pass in custom DataConnect instances. */
export function enrollUserInCourse(
  vars: EnrollUserInCourseVariables,
  options?: OperationOptions
): Promise<ExecuteOperationResponse<EnrollUserInCourseData>>;

/** Generated Node Admin SDK operation action function for the 'ListCoursesForUser' Query. Allow users to execute without passing in DataConnect. */
export function listCoursesForUser(
  dc: DataConnect,
  vars: ListCoursesForUserVariables,
  options?: OperationOptions
): Promise<ExecuteOperationResponse<ListCoursesForUserData>>;
/** Generated Node Admin SDK operation action function for the 'ListCoursesForUser' Query. Allow users to pass in custom DataConnect instances. */
export function listCoursesForUser(
  vars: ListCoursesForUserVariables,
  options?: OperationOptions
): Promise<ExecuteOperationResponse<ListCoursesForUserData>>;
