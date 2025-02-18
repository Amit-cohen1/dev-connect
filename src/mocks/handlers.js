import { http, HttpResponse } from 'msw';

const mockComments = [
  {
    id: '1',
    content: 'Test comment',
    userId: 'testUserId',
    userName: 'Test User',
    timestamp: new Date().toISOString(),
    userAvatar: 'test-avatar.jpg',
    projectId: 'test-project'
  }
];

const mockUsers = [
  {
    id: 'testUserId',
    displayName: 'Test User',
    photoURL: 'test-avatar.jpg'
  }
];

export const handlers = [
  // Mock Firebase Authentication
  http.post('https://*.firebaseapp.com/v1/accounts:signInWithPassword', () => {
    return HttpResponse.json({
      localId: 'testUserId',
      email: 'test@example.com',
      displayName: 'Test User',
      idToken: 'fake-token'
    });
  }),

  // Mock Firestore Comments Collection
  http.get('*/projectComments', () => {
    return HttpResponse.json(mockComments);
  }),

  // Mock Firestore Users Collection
  http.get('*/users/:userId', ({ params }) => {
    const user = mockUsers.find(u => u.id === params.userId);
    return HttpResponse.json(user || {});
  }),

  // Mock comment creation
  http.post('*/projectComments', async ({ request }) => {
    const newComment = await request.json();
    return HttpResponse.json({ id: Date.now().toString(), ...newComment });
  })
];