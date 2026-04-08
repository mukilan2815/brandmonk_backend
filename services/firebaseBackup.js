// Firebase Backup Service - REMOVED
// All functions are no-ops to prevent import errors from any remaining references

const noop = async () => false;

module.exports = {
  backupStudent: noop,
  backupWebinar: noop,
  deleteStudentBackup: noop,
  deleteWebinarBackup: noop,
  backupStudentsBatch: noop,
  backupWebinarsBatch: noop,
  logBackupEvent: noop,
  fullSync: noop,
  getStudentsFromBackup: async () => [],
  getWebinarsFromBackup: async () => [],
  isFirebaseAvailable: () => false,
  COLLECTIONS: {}
};
