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
  additionalData = {},
  submissionId = null
}) => {
  try {
    // Determine the correct link based on notification type
    let link = null;
    if (projectId) {
      switch (type) {
        case 'project_submission':
        case 'submission_review':
          link = `/project/${projectId}?tab=submissions`;
          break;
        case 'new_comment':
        case 'mention':
          link = `/project/${projectId}#comments`;  // Using hash for comments section
          break;
        case 'application_status':
        case 'new_application':
          link = `/project/${projectId}?tab=applications`;
          break;
        default:
          link = `/project/${projectId}`;
      }
    }

    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      message,
      projectId,
      projectTitle,
      senderName,
      status,
      link,
      read: false,
      timestamp: serverTimestamp(),
      submissionId,
      ...additionalData
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notificationTypes = {
  NEW_COMMENT: 'new_comment',
  NEW_MESSAGE: 'new_message',
  APPLICATION_STATUS: 'application_status',
  PROJECT_UPDATE: 'project_update',
  NEW_APPLICATION: 'new_application',
  GENERAL: 'general',
  PROJECT_SUBMISSION: 'project_submission',
  SUBMISSION_REVIEW: 'submission_review',
  SKILLS_UPDATED: 'skills_updated'
};

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

export const sendProjectSubmissionNotification = async (organizationId, projectId, submissionId, developerName) => {
  await sendNotification({
    userId: organizationId,
    type: notificationTypes.PROJECT_SUBMISSION,
    message: `${developerName} has submitted their work for review`,
    projectId,
    submissionId,
    senderName: developerName
  });
};

export const sendSubmissionReviewNotification = async (developerId, projectId, submissionId, status, reviewerName) => {
  await sendNotification({
    userId: developerId,
    type: notificationTypes.SUBMISSION_REVIEW,
    message: `Your project submission has been ${status}`,
    projectId,
    submissionId,
    senderName: reviewerName
  });
};

export const sendSkillsUpdateNotification = async (userId, projectTitle, newSkills) => {
  await sendNotification({
    userId,
    type: notificationTypes.SKILLS_UPDATED,
    message: `Your skills have been updated after completing "${projectTitle}". New skills added: ${newSkills.join(', ')}`,
    projectId: null,
    senderName: 'System'
  });
};