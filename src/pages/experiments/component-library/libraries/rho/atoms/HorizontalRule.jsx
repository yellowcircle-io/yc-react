import React from 'react';

const HorizontalRule = ({
  color = "#d9dfdf",
  thickness = "0.5px",
  width = "100%",
  margin = "0",
  style = "solid",
  opacity = 1,
  className = "",
  customStyle = {}
}) => {
  const ruleStyle = {
    width,
    margin,
    opacity,
    height: "0",
    border: "none",
    borderBottom: `${thickness} ${style} ${color}`,
    ...customStyle
  };

  return (
    <div
      style={ruleStyle}
      className={className}
      role="separator"
      aria-hidden="true"
    />
  );
};

// Preset rule variants for Rho brand
export const RhoThinRule = (props) => (
  <HorizontalRule
    color="#d9dfdf"
    thickness="0.5px"
    {...props}
  />
);

export const RhoMediumRule = (props) => (
  <HorizontalRule
    color="#d9dfdf"
    thickness="1px"
    {...props}
  />
);

export const RhoThickRule = (props) => (
  <HorizontalRule
    color="#000"
    thickness="2px"
    {...props}
  />
);

export const RhoAccentRule = (props) => (
  <HorizontalRule
    color="#00ECC0"
    thickness="3px"
    {...props}
  />
);

// Email-safe version for email templates
export const EmailHorizontalRule = ({
  color = "#d9dfdf",
  thickness = "0.5px",
  width = "100%",
  margin = "0"
}) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{ margin }}>
      <tbody>
        <tr>
          <td style={{
            borderBottom: `${thickness} solid ${color}`,
            width,
            lineHeight: "1px",
            fontSize: "1px"
          }}>
            &nbsp;
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default HorizontalRule;