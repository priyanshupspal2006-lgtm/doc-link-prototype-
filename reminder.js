// Appointment Reminder System

function checkAppointmentReminder(appointmentTime) {
  const currentTime = new Date();
  const appointmentDate = new Date(appointmentTime);
  
  // 24 hours pehle reminder bhej
  const reminderTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);
  
  if (currentTime >= reminderTime && currentTime < appointmentDate) {
    return {
      status: "Reminder",
      message: "Appointment coming up soon!",
      appointmentTime: appointmentDate
    };
  }
  
  return { status: "No reminder needed" };
}

// Export function
module.exports = checkAppointmentReminder;