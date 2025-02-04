// src/utils/notifications.js
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const sendNotification = async ({
  userId,
  type,
  message,
  projectId = null,
  projectTitle = null,
  senderName = null,
  status = null,
  additionalData = {}
}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      message,
      projectId,
      projectTitle,
      senderName,
      status,
      read: false,
      timestamp: serverTimestamp(),
      ...additionalData
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notificationTypes = {
  NEW_MESSAGE: 'new_message',
  APPLICATION_STATUS: 'application_status',
  PROJECT_UPDATE: 'project_update',
  NEW_APPLICATION: 'new_application',
  GENERAL: 'general'
};

// Usage examples:
export const sendMessageNotification = async (userId, senderName, projectId, projectTitle) => {
  await sendNotification({
    userId,
    type: notificationTypes.NEW_MESSAGE,
    message: `New message from ${senderName}`,
    projectId,
    projectTitle,
    senderName
  });
};

export const sendApplicationStatusNotification = async (userId, projectId, projectTitle, status) => {
  await sendNotification({
    userId,
    type: notificationTypes.APPLICATION_STATUS,
    message: `Your application for "${projectTitle}" was ${status}`,
    projectId,
    projectTitle,
    status
  });
};

export const sendProjectUpdateNotification = async (userId, projectId, projectTitle, updateType) => {
  await sendNotification({
    userId,
    type: notificationTypes.PROJECT_UPDATE,
    message: `Project "${projectTitle}" has been ${updateType}`,
    projectId,
    projectTitle,
    updateType
  });
};

export const sendNewApplicationNotification = async (userId, projectId, projectTitle, applicantName) => {
  await sendNotification({
    userId,
    type: notificationTypes.NEW_APPLICATION,
    message: `New application received from ${applicantName} for "${projectTitle}"`,
    projectId,
    projectTitle,
    applicantName
  });
};