const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Check for production / environment SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Development fallback: Use Ethereal test account or console simulation
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EmailService] Using simulated Ethereal SMTP transporter for development');
    return transporter;
  } catch (err) {
    console.warn('[EmailService] SMTP unavailable, using fallback mock transporter:', err.message);
    transporter = {
      sendMail: async (opts) => {
        console.log(`\n================== SIMULATED EMAIL ==================`);
        console.log(`To: ${opts.to}`);
        console.log(`Subject: ${opts.subject}`);
        console.log(`Preview: ${opts.text || 'HTML Email Body'}`);
        console.log(`====================================================\n`);
        return { messageId: `mock_${Date.now()}` };
      },
    };
    return transporter;
  }
};

/**
 * Send 10-Minute Reminder Email to Enrolled Student
 */
exports.sendLiveSessionReminderEmail = async ({
  studentEmail,
  studentName,
  sessionTitle,
  courseTitle,
  instructorName,
  scheduledStartTime,
  joinUrl,
}) => {
  try {
    const mailer = await getTransporter();
    const formattedTime = new Date(scheduledStartTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #d946ef 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .content { padding: 32px 30px; color: #334155; line-height: 1.6; }
          .badge { display: inline-block; padding: 6px 14px; background: #fef2f2; color: #dc2626; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border: 1px solid #fecaca; }
          .highlight-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 20px 0; }
          .btn-container { text-align: center; margin: 30px 0 10px 0; }
          .btn { display: inline-block; padding: 14px 34px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35); }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <p>SkillPulse Live Telecast</p>
            <h1>🔴 Live Class Starting in 10 Minutes!</h1>
          </div>
          <div class="content">
            <span class="badge">Starting Soon</span>
            <p>Hi <strong>${studentName || 'Learner'}</strong>,</p>
            <p>Your enrolled course <strong>"${courseTitle}"</strong> has a live interactive session starting in just 10 minutes.</p>
            
            <div class="highlight-box">
              <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${sessionTitle}</div>
              <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Instructor:</strong> ${instructorName || 'Course Instructor'}</div>
              <div style="font-size: 13px; color: #4f46e5; font-weight: 700;"><strong>Start Time:</strong> ${formattedTime} (Today)</div>
            </div>

            <div class="btn-container">
              <a href="${joinUrl}" class="btn">Enter Live Classroom →</a>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 18px;">
              Can't click the button? Copy and open this link in your browser:<br>
              <a href="${joinUrl}" style="color: #4f46e5;">${joinUrl}</a>
            </p>
          </div>
          <div class="footer">
            You received this notification because you are enrolled in "${courseTitle}".
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailer.sendMail({
      from: `"SkillPulse Live" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@skillpulse.com'}>`,
      to: studentEmail,
      subject: `🔴 Starting in 10 mins: ${sessionTitle} (${courseTitle})`,
      html,
    });

    if (nodemailer.getTestMessageUrl && info) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log(`[EmailService] Ethereal Preview URL: ${preview}`);
    }

    return true;
  } catch (err) {
    console.error(`[EmailService] Failed to send reminder email to ${studentEmail}:`, err.message);
    return false;
  }
};

/**
 * Send Welcome Email to Newly Registered User
 */
exports.sendWelcomeEmail = async ({ studentEmail, studentName, role = 'student' }) => {
  try {
    const mailer = await getTransporter();
    const portalUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #d946ef 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .content { padding: 32px 30px; color: #334155; line-height: 1.6; }
          .welcome-badge { display: inline-block; padding: 6px 14px; background: #e0e7ff; color: #4338ca; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
          .feature-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 24px 0; }
          .feature-item { font-size: 14px; color: #475569; margin-bottom: 10px; display: flex; align-items: center; }
          .feature-item:last-child { margin-bottom: 0; }
          .btn-container { text-align: center; margin: 30px 0 10px 0; }
          .btn { display: inline-block; padding: 14px 34px; background: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35); }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <p>Welcome to SkillPulse LMS</p>
            <h1>🚀 Start Your Learning Journey!</h1>
          </div>
          <div class="content">
            <span class="welcome-badge">Account Created Successfully</span>
            <p>Hi <strong>${studentName || 'Learner'}</strong>,</p>
            <p>Welcome aboard! Your SkillPulse account has been created successfully. We're thrilled to have you join our learning community.</p>

            <div class="feature-list">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 12px; font-size: 15px;">What you get with SkillPulse:</div>
              <div class="feature-item">📚 <strong>Interactive Courses:</strong> HD Video lessons, interactive quizzes & downloadable resources</div>
              <div class="feature-item">🤖 <strong>AI Study Assistant:</strong> 24/7 instant answers to all course-related questions</div>
              <div class="feature-item">🔴 <strong>Live Classroom Telecasts:</strong> Interactive live streams directly from top instructors</div>
              <div class="feature-item">📜 <strong>Verified Certificates:</strong> Earn industry-recognized certificates upon completion</div>
            </div>

            <div class="btn-container">
              <a href="${portalUrl}" class="btn">Explore Courses Now →</a>
            </div>
          </div>
          <div class="footer">
            Sent with ❤️ by SkillPulse LMS. If you did not create this account, please ignore this email.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailer.sendMail({
      from: `"SkillPulse LMS" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@skillpulse.com'}>`,
      to: studentEmail,
      subject: `👋 Welcome to SkillPulse, ${studentName || 'Learner'}!`,
      html,
    });

    console.log(`[EmailService] Welcome email sent to ${studentEmail} (MessageID: ${info?.messageId || 'sent'})`);
    return true;
  } catch (err) {
    console.error(`[EmailService] Failed to send welcome email to ${studentEmail}:`, err.message);
    return false;
  }
};

/**
 * Send Course Enrollment Confirmation Email
 */
exports.sendEnrollmentConfirmationEmail = async ({
  studentEmail,
  studentName,
  courseTitle,
  coursePrice = 0,
  instructorName = 'Course Instructor',
  courseUrl,
}) => {
  try {
    const mailer = await getTransporter();
    const portalUrl = courseUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/courses`;
    const formattedPrice = coursePrice > 0 ? `₹${coursePrice}` : 'Free Access';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .content { padding: 32px 30px; color: #334155; line-height: 1.6; }
          .badge { display: inline-block; padding: 6px 14px; background: #d1fae5; color: #047857; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
          .course-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; }
          .btn-container { text-align: center; margin: 30px 0 10px 0; }
          .btn { display: inline-block; padding: 14px 34px; background: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <p>Enrollment Receipt & Access</p>
            <h1>🎉 You're Enrolled!</h1>
          </div>
          <div class="content">
            <span class="badge">Success</span>
            <p>Hi <strong>${studentName || 'Learner'}</strong>,</p>
            <p>Congratulations! You are officially enrolled in <strong>"${courseTitle}"</strong>.</p>
            
            <div class="course-box">
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${courseTitle}</div>
              <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;"><strong>Instructor:</strong> ${instructorName}</div>
              <div style="font-size: 13px; color: #047857; font-weight: 700;"><strong>Amount Paid:</strong> ${formattedPrice}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Full lifetime access enabled</div>
            </div>

            <div class="btn-container">
              <a href="${portalUrl}" class="btn">Start Learning Now →</a>
            </div>
          </div>
          <div class="footer">
            Thank you for learning with SkillPulse LMS.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailer.sendMail({
      from: `"SkillPulse LMS" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@skillpulse.com'}>`,
      to: studentEmail,
      subject: `🎉 Enrollment Confirmed: ${courseTitle}`,
      html,
    });

    console.log(`[EmailService] Enrollment confirmation email sent to ${studentEmail} (MessageID: ${info?.messageId || 'sent'})`);
    return true;
  } catch (err) {
    console.error(`[EmailService] Failed to send enrollment email to ${studentEmail}:`, err.message);
    return false;
  }
};

/**
 * Send Quiz Results Email to Student
 */
exports.sendQuizResultEmail = async ({
  studentEmail,
  studentName,
  quizTitle,
  courseTitle = 'SkillPulse Course',
  score,
  percentage,
  passed,
  passingScore = 70,
}) => {
  try {
    const mailer = await getTransporter();
    const portalUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const finalScore = percentage !== undefined ? percentage : score;

    const headerBg = passed
      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .header { background: ${headerBg}; padding: 36px 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .content { padding: 32px 30px; color: #334155; line-height: 1.6; }
          .score-card { background: #f8fafc; border: 2px dashed ${passed ? '#10b981' : '#8b5cf6'}; border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
          .score-number { font-size: 48px; font-weight: 900; color: ${passed ? '#059669' : '#6d28d9'}; line-height: 1; margin-bottom: 6px; }
          .status-badge { display: inline-block; padding: 6px 18px; background: ${passed ? '#d1fae5' : '#f3e8ff'}; color: ${passed ? '#047857' : '#6b21a8'}; border-radius: 999px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; }
          .btn-container { text-align: center; margin: 30px 0 10px 0; }
          .btn { display: inline-block; padding: 14px 34px; background: ${passed ? '#10b981' : '#7c3aed'}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35); }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <p>${courseTitle}</p>
            <h1>${passed ? '🏆 Quiz Passed!' : '📊 Quiz Submission Result'}</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${studentName || 'Learner'}</strong>,</p>
            <p>You have completed the quiz <strong>"${quizTitle || 'Assessment'}"</strong>.</p>
            
            <div class="score-card">
              <div class="score-number">${finalScore}%</div>
              <div style="font-size: 13px; color: #64748b;">Passing Threshold: ${passingScore}%</div>
              <span class="status-badge">${passed ? 'PASSED ✓' : 'RETRY SUGGESTED 🔄'}</span>
            </div>

            <p style="font-size: 14px; text-align: center;">
              ${passed 
                ? 'Outstanding work! You have successfully mastered this lesson.' 
                : 'Keep going! Review the lesson material and retake the quiz to improve your score.'}
            </p>

            <div class="btn-container">
              <a href="${portalUrl}" class="btn">${passed ? 'Continue Course →' : 'Retake Quiz →'}</a>
            </div>
          </div>
          <div class="footer">
            SkillPulse LMS Quiz Performance Notification.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailer.sendMail({
      from: `"SkillPulse LMS" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@skillpulse.com'}>`,
      to: studentEmail,
      subject: `${passed ? '🏆 Quiz Passed' : '📊 Quiz Completed'}: ${quizTitle || 'Assessment'} (${finalScore}%)`,
      html,
    });

    console.log(`[EmailService] Quiz result email sent to ${studentEmail} (MessageID: ${info?.messageId || 'sent'})`);
    return true;
  } catch (err) {
    console.error(`[EmailService] Failed to send quiz result email to ${studentEmail}:`, err.message);
    return false;
  }
};

