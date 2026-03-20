export type PlatformConfig = {
  platformName: string;
  platformShortName: string;
  platformDescription: string;
  logoFullUrl: string;
  logoIconUrl: string;
  logoOgUrl: string;
  logoEmailUrl: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  siteUrl: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  ogSiteName: string;
  emailSenderName: string;
  defaultLanguage: string;
  defaultCurrency: string;
};

export type PlatformSettingsInput = {
  name: string;
  description?: string | null;
  shortName?: string | null;
  siteUrl?: string | null;
  defaultMetaTitle?: string | null;
  defaultMetaDescription?: string | null;
  ogSiteName?: string | null;
  logoUrl?: string | null;
  logoFullUrl?: string | null;
  logoIconUrl?: string | null;
  logoOgUrl?: string | null;
  logoEmailUrl?: string | null;
  faviconUrl?: string | null;
  supportEmail?: string | null;
  emailSenderName?: string | null;
  defaultLanguage?: string | null;
  defaultCurrency?: string | null;
};

export type PlatformEmailDefaults = {
  senderName: string;
  supportEmail: string;
  from: string;
  logoEmailUrl: string;
};
