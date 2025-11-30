import React from 'react';
import EmailWrapper from './EmailWrapper';
import Header from './Header';
import Hero, { HeroFullWidth } from './Hero';
import Button from './Button';
import IconRow from './IconRow';
import Footer from './Footer';
import Divider, { Spacer } from './Divider';
import { Heading, Paragraph, Label, Quote, List } from './Text';
import { BRAND_CONFIG } from './index';

/**
 * EmailPreview - Preview component for testing email templates
 *
 * Renders a complete email template using the component library.
 * Useful for development and testing before sending.
 */
function EmailPreview({
  template = 'marketing', // 'marketing' | 'sales' | 'newsletter' | 'announcement'
  data = {}
}) {
  const templates = {
    marketing: <MarketingTemplate data={data} />,
    sales: <SalesTemplate data={data} />,
    newsletter: <NewsletterTemplate data={data} />,
    announcement: <AnnouncementTemplate data={data} />
  };

  return templates[template] || templates.marketing;
}

/**
 * Marketing Template - Brand awareness / thought leadership
 */
function MarketingTemplate({ data }) {
  return (
    <EmailWrapper preheader="Own your story. Build your brand with yellowCircle.">
      <Header />

      <Hero
        headline="OWN YOUR STORY"
        subheadline="Build a brand that resonates"
        imageUrl={data.heroImage || 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/hero-placeholder_rdgnoe.png'}
        imageAlt="Brand illustration"
      />

      <Button
        text="Get Started"
        href="https://yellowcircle-app.web.app/about"
        variant="primary"
      />

      <IconRow
        items={[
          { icon: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-scale_rdgnoe.png', label: 'SCALE' },
          { icon: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-ship_rdgnoe.png', label: 'SHIP' },
          { icon: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1735952878/icon-grow_rdgnoe.png', label: 'GROW' }
        ]}
      />

      <Divider />

      <Spacer height={30} />

      <Paragraph align="center">
        yellowCircle helps B2B companies fix broken GTM systems and build marketing operations that actually work.
      </Paragraph>

      <Spacer height={20} />

      <Footer />
    </EmailWrapper>
  );
}

/**
 * Sales Template - Direct response / prospecting
 */
function SalesTemplate({ data }) {
  const {
    recipientName = 'there',
    companyName = 'your company',
    senderName = 'Chris Cooper'
  } = data;

  return (
    <EmailWrapper preheader={`Quick question about ${companyName}'s GTM`}>
      <Header />

      <Spacer height={20} />

      <Heading level={2} padding="0 40px 10px">
        Hi {recipientName},
      </Heading>

      <Paragraph>
        I noticed {companyName} recently announced a new funding round - congratulations! When B2B companies hit this stage, they often find their marketing operations weren't built for scale.
      </Paragraph>

      <Paragraph>
        At my last org, I identified $2.5M/year in hidden operational costs that came from exactly this kind of rapid growth without infrastructure.
      </Paragraph>

      <Paragraph>
        Would it make sense to chat about what you're seeing on the GTM side?
      </Paragraph>

      <Paragraph>
        — {senderName}
      </Paragraph>

      <Spacer height={20} />

      <Button
        text="Book a Call"
        href="https://calendly.com/christophercooper"
        variant="primary"
      />

      <Spacer height={30} />

      <Footer showSocial={false} />
    </EmailWrapper>
  );
}

/**
 * Newsletter Template - Regular updates
 */
function NewsletterTemplate({ data }) {
  const {
    title = 'This Week in GTM',
    items = [
      'Why your attribution model is lying to you',
      'The hidden cost of marketing operations theater',
      'Three questions to ask before your next tech purchase'
    ]
  } = data;

  return (
    <EmailWrapper preheader={title}>
      <Header />

      <HeroFullWidth
        headline={title}
        subheadline="Weekly insights on GTM operations"
      />

      <Spacer height={30} />

      <Label>THIS WEEK</Label>

      <List items={items} />

      <Spacer height={20} />

      <Quote>
        "The best marketing operations are invisible - until they break."
      </Quote>

      <Spacer height={30} />

      <Button
        text="Read More"
        href={BRAND_CONFIG.links.browse}
        variant="secondary"
      />

      <Spacer height={30} />

      <Footer />
    </EmailWrapper>
  );
}

/**
 * Announcement Template - Important updates
 */
function AnnouncementTemplate({ data }) {
  const {
    headline = 'Big News',
    body = 'We have something exciting to share with you.',
    ctaText = 'Learn More',
    ctaUrl = BRAND_CONFIG.links.browse
  } = data;

  return (
    <EmailWrapper preheader={headline}>
      <Header />

      <HeroFullWidth
        headline={headline}
        backgroundColor={BRAND_CONFIG.colors.black}
        headlineColor={BRAND_CONFIG.colors.yellow}
      />

      <Spacer height={30} />

      <Paragraph size="large" align="center">
        {body}
      </Paragraph>

      <Spacer height={20} />

      <Button
        text={ctaText}
        href={ctaUrl}
        variant="dark"
      />

      <Spacer height={40} />

      <Footer />
    </EmailWrapper>
  );
}

export default EmailPreview;

// Export individual templates for direct use
export { MarketingTemplate, SalesTemplate, NewsletterTemplate, AnnouncementTemplate };
