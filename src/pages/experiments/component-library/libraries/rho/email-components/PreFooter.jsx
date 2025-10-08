import React from 'react';

const PreFooter = ({
  headline = "Why thousands of founders love Rho",
  description = "Our fee-free banking platform, >$1M in startup perks, and team that will go to the end of the earth to see your company win. Learn more about why Rho will be the perfect fit for your business, too.",
  testimonials = [
    {
      quote: "We love Rho. Their cash management capabilities and founder-friendly support have been amazing while we build our business.",
      name: "Dylan Babbs",
      title: "Co-founder @ Profound",
      avatar: "https://placehold.co/44x44/EDEDED/999999"
    },
    {
      quote: "I chose Rho because their team is hands-down one of the most responsive and supportive I've worked with. As a lean startup, that level of service matters.",
      name: "Caitlin Leksana",
      title: "CEO @ FeaZenith",
      avatar: "https://placehold.co/44x44/EDEDED/999999"
    }
  ],
  ctaText = "Explore Now",
  ctaUrl = "#",
  ctaBackgroundColor = "#00ECC0",
  ctaTextColor = "#000"
}) => {
  return (
    <table role="presentation" width="100%" cellSpacing="0" style={{
      background: "#FFFFFF",
      border: 0
    }}>
      <tbody>
        <tr>
          <td style={{ padding: "24px 24px 8px 24px" }}>
            <div style={{
              fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
              fontSize: "42px",
              lineHeight: "48px",
              fontWeight: "bold",
              color: "#000"
            }}>
              {headline}
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "0 24px 12px 24px" }}>
            <div style={{
              maxWidth: "560px",
              fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: "#000",
              fontWeight: 400
            }}>
              {description}
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ padding: "24px 24px 20px 24px" }}>
            <table role="presentation" width="100%" cellSpacing="0" style={{ border: 0 }}>
              <tbody>
                <tr>
                  {testimonials.slice(0, 2).map((testimonial, index) => (
                    <td key={index} style={{
                      padding: index === 0 ? "0 5px 0 0" : "0 0 0 5px",
                      width: "50%"
                    }} valign="top">
                      <table role="presentation" width="100%" style={{
                        border: "1px solid #E6E6E6",
                        borderRadius: "10px",
                        background: "#d9dfdf"
                      }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: "16px" }}>
                              <table role="presentation" width="100%">
                                <tbody>
                                  <tr>
                                    <td valign="top" width="44">
                                      <div style={{
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "22px",
                                        background: "#EDEDED"
                                      }}></div>
                                    </td>
                                    <td style={{ paddingLeft: "10px" }}>
                                      <div style={{
                                        fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                                        fontSize: "14px",
                                        lineHeight: "20px",
                                        fontWeight: "bold",
                                        color: "#000"
                                      }}>
                                        {testimonial.name}
                                      </div>
                                      <div style={{
                                        fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                                        fontSize: "12px",
                                        lineHeight: "18px",
                                        color: "#555"
                                      }}>
                                        {testimonial.title}
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <div style={{
                                marginTop: "10px",
                                fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                                fontSize: "14px",
                                lineHeight: "20px",
                                color: "#000"
                              }}>
                                "{testimonial.quote}"
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        {ctaText && (
          <tr>
            <td style={{ padding: "0 24px 24px 24px" }}>
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
        )}
      </tbody>
    </table>
  );
};

export default PreFooter;