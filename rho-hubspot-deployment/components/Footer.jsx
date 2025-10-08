import React from 'react';

const Footer = ({
  companyName = "Rho Technologies",
  address = "100 Crosby Street",
  city = "New York",
  state = "NY",
  zip = "10012",
  backgroundColor = "#0D0F10",
  textColor = "#fff",
  showUnsubscribe = true,
  unsubscribeUrl = "#",
  showSocialLinks = true,
  socialLinks = {
    linkedin: "https://linkedin.com/company/rhobusiness/",
    twitter: "https://x.com/rhobusiness",
    luma: "https://lu.ma/calendar/manage/cal-vSo9sRaAQOgoflu"
  },
  logoUrl = "https://39998325.hs-sites.com/hubfs/Rho-Logo.png",
  disclaimerText = "Rho is a fintech company, not a bank or an FDIC-insured depository institution. Checking account and card services are provided by Webster Bank N.A., member FDIC. Savings account services are provided by American Deposit Management Co. and its partner banks. International and foreign currency payments services are provided by Wise US Inc. FDIC deposit insurance coverage is available only to protect you against the failure of an FDIC-insured bank that holds your deposits and is subject to FDIC limitations and requirements. It does not protect you against the failure of Rho or other third party. Products and services offered through the Rho platform are subject to approval."
}) => {
  return (
    <table role="presentation" width="100%" style={{
      background: backgroundColor,
      border: 0
    }}>
      <tbody>
        <tr>
          <td style={{ padding: "24px", textAlign: "left" }}>
            <table width="100%" role="presentation">
              <tbody>
                <tr>
                  <td width="70%" valign="top">
                    <img
                      src={logoUrl}
                      alt="Rho"
                      style={{
                        maxWidth: "60px",
                        marginBottom: "12px"
                      }}
                    />
                    <p style={{
                      margin: "0",
                      fontSize: "13px",
                      lineHeight: "18px",
                      color: "#fff"
                    }}>
                      {companyName}
                    </p>
                    <p style={{
                      margin: "2px 0 0",
                      color: "#b6b6b6",
                      fontSize: "12px",
                      lineHeight: "18px"
                    }}>
                      {address}<br />
                      {city}, {state} {zip}
                    </p>
                  </td>
                  <td width="30%" valign="top" align="right">
                    {showSocialLinks && (
                      <>
                        <a href={socialLinks.linkedin} style={{
                          margin: "0 4px",
                          display: "inline-block"
                        }}>
                          <img src="https://placehold.co/24x24/ffffff/000000?text=LI" width="24" alt="LinkedIn" />
                        </a>
                        <a href={socialLinks.twitter} style={{
                          margin: "0 4px",
                          display: "inline-block"
                        }}>
                          <img src="https://placehold.co/24x24/ffffff/000000?text=X" width="24" alt="Twitter" />
                        </a>
                        <a href={socialLinks.luma} style={{
                          margin: "0 4px",
                          display: "inline-block"
                        }}>
                          <img src="https://placehold.co/24x24/ffffff/000000?text=LU" width="24" alt="Luma" />
                        </a>
                      </>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ height: "16px", lineHeight: "16px", fontSize: "0" }}></div>

            <table width="100%" role="presentation">
              <tbody>
                <tr>
                  <td style={{
                    color: "#c9c9c9",
                    fontSize: "12px",
                    lineHeight: "18px"
                  }}>
                    {disclaimerText}
                    <br /><br />
                    {companyName}, {address}, {city}, {state} {zip}<br />
                    {showUnsubscribe && (
                      <a href={unsubscribeUrl} style={{ color: "#c9c9c9" }}>Unsubscribe</a>
                    )}
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

export default Footer;