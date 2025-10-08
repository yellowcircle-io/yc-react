import React from 'react';

const BodyWithCTA = ({
  greeting = "Hi there,",
  content = [
    "What an event! Thank you for taking the time out of your busy schedule to join us.",
    "At Rho, we've hosted hundreds of events to date, and now we're organizing 10–15 gatherings per week across New York, San Francisco, and now Boston.",
    "Whether a dinner, poker night, or afternoon tennis, we'd love to see you again. Subscribe below and we'll keep you up-to-date on everything exciting that's coming soon."
  ],
  ctaQuestion = "Want to be the first to hear about our next event?",
  ctaText = "Keep me updated",
  ctaUrl = "https://lu.ma/rho",
  ctaBackgroundColor = "#00ECC0",
  ctaTextColor = "#000",
  closingText = [
    "Thanks again for a wonderful time, and see you again soon!",
    "All the best,\nThe Rho Team"
  ]
}) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{
      background: "#FFFFFF",
      border: 0,
      borderBottom: "0.5px solid #d9dfdf"
    }}>
      <tbody>
        <tr>
          <td style={{ padding: "24px 0 8px 0" }}>
            <p style={{
              margin: "0",
              fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: "#000"
            }}>
              {greeting}
            </p>
            {Array.isArray(content) ? content.map((paragraph, index) => (
              <p key={index} style={{
                margin: "16px 0 0 0",
                fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                fontSize: "14px",
                lineHeight: "20px",
                color: "#000"
              }}>
                {paragraph}
              </p>
            )) : (
              <p style={{
                margin: "16px 0 0 0",
                fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                fontSize: "14px",
                lineHeight: "20px",
                color: "#000"
              }}>
                {content}
              </p>
            )}
            <p style={{
              margin: "16px 0",
              fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: "bold",
              color: "#000"
            }}>
              {ctaQuestion}
            </p>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "0 0 16px 0" }}>
            <a
              href={ctaUrl}
              style={{
                display: "inline-block",
                background: ctaBackgroundColor,
                borderRadius: "2px",
                padding: "12px 20px",
                fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                fontSize: "16px",
                lineHeight: "20px",
                fontWeight: "bold",
                color: ctaTextColor,
                textDecoration: "none"
              }}
            >
              {ctaText}
            </a>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "8px 0 24px 0" }}>
            {closingText.map((text, index) => (
              <p key={index} style={{
                margin: index === 0 ? "0" : "16px 0 0 0",
                fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                fontSize: "14px",
                lineHeight: "20px",
                color: "#000"
              }}>
                {text.includes('\n') ? (
                  <>
                    {text.split('\n')[0]}<br />
                    <strong>{text.split('\n')[1]}</strong>
                  </>
                ) : text}
              </p>
            ))}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default BodyWithCTA;