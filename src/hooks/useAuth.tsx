import { useState, useEffect, createContext, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't want to crash the app, but we want to log it
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          let docSnap;
          
          try {
            docSnap = await getDoc(docRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          
          if (!docSnap || !docSnap.exists()) {
            // Check if user was pre-authorized by email
            const preAuthQuery = query(
              collection(db, 'users'), 
              where('email', '==', firebaseUser.email),
              where('isPreAuthorized', '==', true)
            );
            
            let preAuthSnap;
            try {
              preAuthSnap = await getDocs(preAuthQuery);
            } catch (err) {
              handleFirestoreError(err, OperationType.LIST, 'users (pre-auth check)');
            }

            if (preAuthSnap && !preAuthSnap.empty) {
              const preAuthDoc = preAuthSnap.docs[0];
              const preAuthData = preAuthDoc.data();
              const isInitialSuperAdmin = firebaseUser.email?.toLowerCase().trim() === 'mindpathtrainingcenter@gmail.com';
              
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || preAuthData.displayName || 'User',
                email: firebaseUser.email || '',
                role: isInitialSuperAdmin ? 'SUPER_ADMIN' : (preAuthData.role || 'GURU'),
                schoolId: preAuthData.schoolId,
                photoURL: firebaseUser.photoURL || '',
                createdAt: new Date().toISOString(),
                status: 'APPROVED'
              };

              try {
                await setDoc(docRef, {
                  ...newProfile,
                  createdAt: serverTimestamp()
                });
                await deleteDoc(preAuthDoc.ref);
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
              }
              
              setProfile(newProfile);
            } else {
              // Standard initial profile creation
              const isInitialSuperAdmin = firebaseUser.email?.toLowerCase().trim() === 'mindpathtrainingcenter@gmail.com';
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: isInitialSuperAdmin ? 'SUPER_ADMIN' : 'GURU',
                photoURL: firebaseUser.photoURL || '',
                createdAt: new Date().toISOString(),
                status: isInitialSuperAdmin ? 'APPROVED' : 'PENDING'
              };
              
              try {
                await setDoc(docRef, {
                  ...newProfile,
                  createdAt: serverTimestamp()
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
              }
              setProfile(newProfile);
            }
          } else {
            const data = docSnap.data() as UserProfile;
            const detectedEmail = firebaseUser.email?.toLowerCase().trim();
            const isInitialSuperAdmin = detectedEmail === 'mindpathtrainingcenter@gmail.com';
            
            console.log("Auth Debug - Detected Email:", detectedEmail);
            console.log("Auth Debug - Is Super Admin Email:", isInitialSuperAdmin);
            
            let finalProfile = data;
            if (isInitialSuperAdmin && (data.role !== 'SUPER_ADMIN' || data.status !== 'APPROVED')) {
              finalProfile = { ...data, role: 'SUPER_ADMIN' as UserRole, status: 'APPROVED' };
              // Try to update database in background
              updateDoc(docRef, { role: 'SUPER_ADMIN', status: 'APPROVED' }).catch(err => {
                console.error("Background role/status update failed:", err);
              });
            }
            
            setProfile(finalProfile);

            // Update last active
            try {
              await updateDoc(docRef, { lastActive: serverTimestamp() });
            } catch (err) {
              // Ignore last active update errors to not block login
            }
          }
        } catch (error) {
          console.error("Critical Auth Error:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
