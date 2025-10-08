import React from 'react';

const TwoColumnCards = ({
  cards = [
    {
      image: "https://placehold.co/300x200/e0e0e0/666666?text=Glimpse+Event",
      alt: "Glimpse event",
      title: "Glimpse",
      description: "For Glimpse's Series A raise and 1-year anniversary, we marked the moment with a special gathering of their team, investors, and brand partners.",
      linkText: "Learn More →",
      url: "#"
    },
    {
      image: "https://placehold.co/300x200/e0e0e0/666666?text=Nexxa.ai+Billboard",
      alt: "Nexxa.ai",
      title: "Nexxa.ai",
      description: "After raising $4.4M, we featured Nexxa up in the bright lights of Times Square! All Rho customers get a billboard on us, design support included.",
      linkText: "Learn More →",
      url: "#"
    }
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
          <td style={{ padding: "24px 24px 0px 24px" }}>
            <table role="presentation" width="100%" cellSpacing="0" style={{ border: 0 }}>
              <tbody>
                <tr>
                  {cards.slice(0, 2).map((card, index) => (
                    <td key={index} style={{
                      padding: index === 0 ? "0 5px 0 0" : "0 0 0 5px",
                      width: "50%"
                    }} valign="top">
                      <table role="presentation" width="100%" style={{
                        border: "1px solid #CCCCCC",
                        borderRadius: "6px",
                        overflow: "hidden"
                      }}>
                        <tbody>
                          <tr>
                            <td>
                              <img
                                src={card.image}
                                width="100%"
                                height="120"
                                alt={card.alt}
                                style={{
                                  display: "block",
                                  height: "120px",
                                  objectFit: "cover",
                                  width: "100%"
                                }}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: "15px" }}>
                              <div style={{
                                fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                                fontSize: "24px",
                                lineHeight: "30px",
                                fontWeight: "bold",
                                color: "#000"
                              }}>
                                {card.title}
                              </div>
                              <div style={{
                                marginTop: "8px",
                                fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                                fontSize: "14px",
                                lineHeight: "20px",
                                color: "#000"
                              }}>
                                {card.description}
                              </div>
                              <div style={{ marginTop: "10px" }}>
                                <a href={card.url} style={{
                                  fontFamily: "Helvetica,'Basier Circle',Roboto,Arial,sans-serif",
                                  fontSize: "14px",
                                  lineHeight: "20px",
                                  fontWeight: "bold",
                                  color: "#000",
                                  textDecoration: "none"
                                }}>
                                  {card.linkText}
                                </a>
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
        <tr>
          <td style={{ padding: "0 24px 24px 24px" }}>
            {/* Bottom spacing */}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default TwoColumnCards;