import React from 'react';

const Button = ({
  text = "Click here",
  href = "#",
  backgroundColor = "#00ECC0",
  textColor = "#000",
  padding = "12px 20px",
  borderRadius = "2px",
  fontSize = "16px",
  fontWeight = "bold",
  fontFamily = "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
  lineHeight = "20px",
  display = "inline-block",
  textDecoration = "none",
  border = "none",
  hoverBackgroundColor = null,
  hoverTextColor = null,
  className = "",
  style = {},
  ...props
}) => {
  const buttonStyle = {
    display,
    background: backgroundColor,
    borderRadius,
    padding,
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight,
    color: textColor,
    textDecoration,
    border,
    cursor: "pointer",
    transition: "all 0.3s ease",
    ...style
  };

  const handleMouseEnter = (e) => {
    if (hoverBackgroundColor) {
      e.target.style.backgroundColor = hoverBackgroundColor;
    }
    if (hoverTextColor) {
      e.target.style.color = hoverTextColor;
    }
  };

  const handleMouseLeave = (e) => {
    e.target.style.backgroundColor = backgroundColor;
    e.target.style.color = textColor;
  };

  return (
    <a
      href={href}
      style={buttonStyle}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {text}
    </a>
  );
};

// Preset button variants for Rho brand
export const RhoPrimaryButton = (props) => (
  <Button
    backgroundColor="#00ECC0"
    textColor="#000"
    hoverBackgroundColor="#00d4a8"
    {...props}
  />
);

export const RhoSecondaryButton = (props) => (
  <Button
    backgroundColor="transparent"
    textColor="#000"
    border="2px solid #000"
    hoverBackgroundColor="#000"
    hoverTextColor="#fff"
    {...props}
  />
);

export const RhoLightButton = (props) => (
  <Button
    backgroundColor="#f8f9fa"
    textColor="#000"
    border="1px solid #d9dfdf"
    hoverBackgroundColor="#e9ecef"
    {...props}
  />
);

export default Button;