import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface Feedback {
  id?: string;
  userId: string;
  rating: number;
  comments: string;
  createdAt: any; // Firestore timestamp
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
