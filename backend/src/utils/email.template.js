export const baseEmailTemplate = ({ title, content }) => {
    return `
    <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6;">

      <h2 style="color:#2F2FE4; margin-bottom:20px;">
        ${title}
      </h2>

      ${content}

      <hr style="border:0; border-top:1px solid #eee; margin:30px 0;" />

      <p style="font-size:12px; color:#777;">
        Star Dewedar System - Automated Email
      </p>

    </div>
  `;
};