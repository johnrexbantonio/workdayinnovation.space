import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { Course, Enrollment, Allocation, EnrollmentStatus } from '@/lib/types';
import { User } from '@/contexts/AuthContext';
import Papa from 'papaparse';

// Collections
const COURSES_COL = 'courses';
const ENROLLMENTS_COL = 'enrollments';
const ALLOCATIONS_COL = 'allocations';

// We use a singleton doc for global pool simply to make it easy to manage
const GLOBAL_POOL_ID = 'global_credit_pool';

// Fetch courses
export const getCourses = async (): Promise<Course[]> => {
  const snapshot = await getDocs(collection(db, COURSES_COL));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};

// Upload courses from CSV
export const uploadCoursesCsv = async (csvContent: string): Promise<boolean> => {
  return new Promise((resolve) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const courses = results.data as Record<string, string>[];
          // For simplicity, we write all courses with a generated ID or specific ID.
          // In a real app, we might want to batch this or clear existing.
          const batchPromises = courses.map(course => {
            const docRef = doc(collection(db, COURSES_COL));
            return setDoc(docRef, {
              "Product Area": course["Product Area"] || "",
              "Program Name": course["Program Name"] || "",
              "Certification Type": course["Certification Type"] || "",
              "Offering": course["Offering"] || "",
              "Offering Type": course["Offering Type"] || "",
              "Required": course["Required"] || "",
              "Training Cost": course["Training Cost"] || "0",
              "Training Units": course["Training Units"] || "0"
            });
          });
          await Promise.all(batchPromises);
          resolve(true);
        } catch (e) {
          console.error(e);
          resolve(false);
        }
      },
      error: (error: Error) => {
        console.error("CSV Parse Error", error);
        resolve(false);
      }
    });
  });
};

// Get Global Credit Pool
export const getGlobalCredits = async (): Promise<Allocation> => {
  const docRef = doc(db, ALLOCATIONS_COL, GLOBAL_POOL_ID);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as Allocation;
  }
  // Initialize if not exists
  const defaultAlloc = {
    id: GLOBAL_POOL_ID,
    totalCredits: 500,
    usedCredits: 0,
    managerId: 'global'
  };
  await setDoc(docRef, defaultAlloc);
  return defaultAlloc;
};

export const updateGlobalCredits = async (totalCredits: number) => {
  const docRef = doc(db, ALLOCATIONS_COL, GLOBAL_POOL_ID);
  await updateDoc(docRef, { totalCredits });
};

// Request Training
export const requestTraining = async (employeeEmail: string, managerEmail: string, course: Course): Promise<boolean> => {
  try {
    const newEnrollmentRef = doc(collection(db, ENROLLMENTS_COL));
    const enrollment: Enrollment = {
      id: newEnrollmentRef.id,
      employeeEmail,
      managerEmail,
      courseId: course.id,
      courseName: course["Offering"],
      credits: parseInt(course["Training Units"] || "0"),
      status: 'pending',
      requestDate: new Date().toISOString()
    };
    await setDoc(newEnrollmentRef, enrollment);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Get user enrollments
export const getUserEnrollments = async (email: string): Promise<Enrollment[]> => {
  const q = query(collection(db, ENROLLMENTS_COL), where("employeeEmail", "==", email));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Enrollment);
};

// Get team enrollments (for a manager)
export const getTeamEnrollments = async (): Promise<Enrollment[]> => {
  // In a real scenario, this would filter by managerEmail. For this shared pool design,
  // we could just load all pending or fetch based on the manager's team.
  // We'll fetch all and filter client-side for simplicity, or just fetch all since it's a shared manager view.
  const snapshot = await getDocs(collection(db, ENROLLMENTS_COL));
  return snapshot.docs.map(doc => doc.data() as Enrollment);
};

// Update enrollment status
export const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: EnrollmentStatus,
  credits: number,
  rejectionReason?: string
) => {
  const docRef = doc(db, ENROLLMENTS_COL, enrollmentId);
  await updateDoc(docRef, {
    status,
    rejectionReason: rejectionReason || null,
    ...(status === 'approved' ? { approvedDate: new Date().toISOString() } : {})
  });

  // If approved, deduct from global pool
  if (status === 'approved') {
    const pool = await getGlobalCredits();
    const poolRef = doc(db, ALLOCATIONS_COL, GLOBAL_POOL_ID);
    await updateDoc(poolRef, {
      usedCredits: pool.usedCredits + credits
    });
  }
};

// Get all users (for Admin)
export const getAllUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => doc.data() as User);
};

export const updateUserRole = async (email: string, role: string) => {
  const docRef = doc(db, 'users', email);
  await updateDoc(docRef, { role });
};
