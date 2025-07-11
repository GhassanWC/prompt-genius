import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface Feedback {
  id?: string;
  userId: string;
  rating: number;
  comments: string;
  createdAt: any; // Firestore timestamp
}

export interface Testimonial {
  id: string;
  rating: number;
  comments: string;
  author: {
    name: string;
    photoURL: string | null;
  };
}

export const submitFeedback = async (
  userId: string,
  rating: number,
  comments: string
): Promise<void> => {
  if (!userId) {
    throw new Error('User must be logged in to submit feedback.');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5.');
  }

  if (!comments.trim()) {
    throw new Error('Feedback comments cannot be empty.');
  }
  
  try {
    await addDoc(collection(db, 'feedback'), {
      userId,
      rating,
      comments,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error submitting feedback: ", error);
    throw new Error('Failed to submit feedback. Please try again.');
  }
};


export const getPublicFeedback = async (count: number): Promise<Testimonial[]> => {
  try {
    const feedbackCollectionRef = collection(db, 'feedback');
    // Get the most recent feedback, ordered by creation date.
    const q = query(
      feedbackCollectionRef,
      orderBy('createdAt', 'desc'),
      limit(count)
    );

    const feedbackSnapshot = await getDocs(q);
    if (feedbackSnapshot.empty) {
      return [];
    }

    const feedbackList = feedbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
    
    // Get all unique user IDs from the feedback
    const userIds = [...new Set(feedbackList.map(f => f.userId))];
    
    if (userIds.length === 0) {
        return [];
    }
    console.log('userIds', userIds);
    // Fetch all user profiles in one go
    const usersCollectionRef = collection(db, 'users');
    const usersQuery = query(usersCollectionRef, where('__name__', 'in', userIds));
    const usersSnapshot = await getDocs(usersQuery);
    
    const usersMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data()]));

    // Combine feedback with user data
    const testimonials: Testimonial[] = feedbackList.map(feedback => {
      const userData = usersMap.get(feedback.userId);
      return {
        id: feedback.id!,
        rating: feedback.rating,
        comments: feedback.comments,
        author: {
          name: userData?.email || 'Anonymous',
          photoURL: userData?.photoURL || null,
        }
      };
    });

    return testimonials;
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      console.error("Firestore index required for feedback query:", error);
      throw new Error("A database index is required for this feature. Please create it using the link in your browser's developer console.");
    }
    console.error("Error fetching public feedback:", error);
    // It's better not to throw here to avoid breaking the landing page if feedback fails to load.
    return [];
  }
};
