import React from 'react';

const Header = ({
  date = "10.02.2025",
  kicker = "Event Recap",
  logoUrl = "https://39998325.hs-sites.com/hubfs/Rho-Logo.png",
  logoMaxWidth = "90",
  logoAlt = "Rho Logo"
}) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{
      background: "#FFFFFF",
      border: 0,
      borderBottom: "0.5px solid #d9dfdf"
    }}>
      <tbody>
        <tr>
          <td style={{ padding: "20px 0" }}>
            <table role="presentation" width="100%" cellSpacing="0" style={{ border: 0 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "0px" }} align="left" valign="middle">
                    <img
                      src={logoUrl}
                      alt={logoAlt}
                      style={{
                        display: "block",
                        height: "auto",
                        maxWidth: `${logoMaxWidth}px`
                      }}
                    />
                  </td>
                  <td style={{ padding: "0px" }} align="right" valign="middle">
                    <div style={{
                      fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      fontWeight: "bold",
                      color: "#000"
                    }}>
                      {date}
                    </div>
                    <div style={{
                      fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                      fontSize: "14px",
                      lineHeight: "20px",
                      fontWeight: "bold",
                      color: "#000"
                    }}>
                      {kicker}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Header;