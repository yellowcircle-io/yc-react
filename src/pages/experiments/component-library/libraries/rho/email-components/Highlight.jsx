import React from 'react';

const Highlight = ({
  headline = "Big News Ahead",
  description = "We're excited to share some important updates that will help you get the most out of your experience with us. Stay tuned for more information coming soon.",
  headlineColor = "#000",
  descriptionColor = "#000",
  backgroundColor = "#ffffff"
}) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{
      background: backgroundColor,
      border: "0px 0px 0.5px",
      borderColor: "#d9dfdf",
      borderStyle: "solid",
      height: "156px"
    }}>
      <tbody>
        <tr style={{ height: "96px" }}>
          <td style={{ padding: "24px 24px 8px 24px", height: "96px" }}>
            <div style={{
              fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
              fontSize: "42px",
              lineHeight: "48px",
              fontWeight: "lighter",
              color: headlineColor
            }}>
              {headline}
            </div>
          </td>
        </tr>
        <tr style={{ height: "60px" }}>
          <td style={{ padding: "0px 24px 24px 24px", height: "60px" }}>
            <div style={{
              maxWidth: "560px",
              fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: descriptionColor,
              fontWeight: 400
            }}>
              {description}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Highlight;