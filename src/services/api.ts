import { CAMPUS_DIRECTORY } from '@config/directory';
import { STUDENT_DIRECTORY } from '@config/studentDirectory';

import { DirectoryEntry, StudentDirectoryEntry } from '@/types';

export const fetchDirectory = async (): Promise<DirectoryEntry[]> => {
  // await delay(1000); // Removed delay for faster loading
  return CAMPUS_DIRECTORY;
};

export const fetchStudentDirectory = async (): Promise<StudentDirectoryEntry[]> => {
  // await delay(1000);
  return STUDENT_DIRECTORY;
};
