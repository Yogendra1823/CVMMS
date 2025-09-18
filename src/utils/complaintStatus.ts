export const getComplaintStatus = (createdAt: string): 'Not Yet Started' | 'In Progress' | 'Resolved' => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  if (diffInDays < 1) return 'Not Yet Started';
  if (diffInDays < 2) return 'In Progress';
  return 'Resolved';
};

export const generateComplaintId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CMP-${timestamp.slice(-6)}-${random}`;
};