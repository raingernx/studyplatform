"use client";

import React, { useMemo, useState } from "react";
import {
  Button,
  FormSection,
  Input,
  PageContent,
  Select,
  SectionHeader,
  Switch,
  Textarea,
  useToast,
} from "@/design-system";
import { BrandAssetField } from "@/components/admin/settings";
import { PLATFORM_DEFAULTS } from "@/lib/platform/platform-defaults";
import type {
  PlatformConfig,
  PlatformStoredSettings,
} from "@/lib/platform/platform.types";

type Currency = "USD" | "THB" | "EUR";
type CurrencyDisplayFormat = "symbol" | "thai_text";
type Timezone =
  | "UTC"
  | "Asia/Bangkok"
  | "Asia/Singapore"
  | "Europe/London"
  | "America/New_York";
type StorageProvider = "local" | "s3";
type Language = "th" | "en";
type PaymentProvider = "stripe" | "promptpay";

interface AdminSettingsState {
  platformName: string;
  platformShortName: string;
  platformDescription: string;
  siteUrl: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  ogSiteName: string;
  logoUrl: string;
  logoFullUrl: string;
  logoFullDarkUrl: string;
  logoIconUrl: string;
  logoIconDarkUrl: string;
  logoOgUrl: string;
  logoEmailUrl: string;
  faviconUrl: string;
  supportEmail: string;
  emailSenderName: string;
  defaultCurrency: Currency;
  timezone: Timezone;
  currencyDisplayFormat: CurrencyDisplayFormat;
  defaultLanguage: Language;
  defaultCommission: number;
  minPrice: number;
  allowFreeResources: boolean;
  requireReviewBeforePublish: boolean;
  autoPublishResources: boolean;
  allowUserReviews: boolean;
  allowReportingResources: boolean;
  paymentProvider: PaymentProvider;
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  promptpayQrId: string;
  promptpayPhoneNumber: string;
  maxFileSizeMb: number;
  allowedFileTypes: string;
  storageProvider: StorageProvider;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  seoOpenGraphImageUrl: string;
  seoTwitterCardImageUrl: string;
}

type PersistedPlatformState = Pick<
  AdminSettingsState,
  | "platformName"
  | "platformShortName"
  | "platformDescription"
  | "siteUrl"
  | "defaultMetaTitle"
  | "defaultMetaDescription"
  | "ogSiteName"
  | "logoUrl"
  | "logoFullUrl"
  | "logoFullDarkUrl"
  | "logoIconUrl"
  | "logoIconDarkUrl"
  | "logoOgUrl"
  | "logoEmailUrl"
  | "faviconUrl"
  | "supportEmail"
  | "emailSenderName"
  | "defaultCurrency"
  | "defaultLanguage"
>;

type BrandAssetFieldKey =
  | "logoFullUrl"
  | "logoFullDarkUrl"
  | "logoIconUrl"
  | "logoIconDarkUrl"
  | "logoOgUrl"
  | "logoEmailUrl"
  | "faviconUrl";

const DEFAULT_SETTINGS: AdminSettingsState = {
  platformName: PLATFORM_DEFAULTS.platformName,
  platformShortName: PLATFORM_DEFAULTS.platformShortName,
  platformDescription: PLATFORM_DEFAULTS.platformDescription,
  siteUrl: PLATFORM_DEFAULTS.siteUrl,
  defaultMetaTitle: PLATFORM_DEFAULTS.defaultMetaTitle,
  defaultMetaDescription: PLATFORM_DEFAULTS.defaultMetaDescription,
  ogSiteName: PLATFORM_DEFAULTS.ogSiteName,
  logoUrl: PLATFORM_DEFAULTS.logoUrl,
  logoFullUrl: PLATFORM_DEFAULTS.logoFullUrl,
  logoFullDarkUrl: PLATFORM_DEFAULTS.logoFullDarkUrl,
  logoIconUrl: PLATFORM_DEFAULTS.logoIconUrl,
  logoIconDarkUrl: PLATFORM_DEFAULTS.logoIconDarkUrl,
  logoOgUrl: PLATFORM_DEFAULTS.logoOgUrl,
  logoEmailUrl: PLATFORM_DEFAULTS.logoEmailUrl,
  faviconUrl: PLATFORM_DEFAULTS.faviconUrl,
  supportEmail: PLATFORM_DEFAULTS.supportEmail,
  emailSenderName: PLATFORM_DEFAULTS.emailSenderName,
  defaultCurrency: PLATFORM_DEFAULTS.defaultCurrency as Currency,
  timezone: "Asia/Bangkok",
  currencyDisplayFormat: "symbol",
  defaultLanguage: PLATFORM_DEFAULTS.defaultLanguage as Language,
  defaultCommission: 15,
  minPrice: 3,
  allowFreeResources: true,
  requireReviewBeforePublish: true,
  autoPublishResources: false,
  allowUserReviews: true,
  allowReportingResources: true,
  paymentProvider: "stripe",
  stripePublicKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  promptpayQrId: "",
  promptpayPhoneNumber: "",
  maxFileSizeMb: 200,
  allowedFileTypes: "pdf, docx, pptx, xlsx, zip",
  storageProvider: "local",
  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  smtpFromEmail: "no-reply@example.com",
  seoOpenGraphImageUrl: "",
  seoTwitterCardImageUrl: "",
};

function normalizeStoredValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function toPersistedPlatformState(
  platform: PlatformConfig,
  stored?: PlatformStoredSettings,
): PersistedPlatformState {
  return {
    platformName: platform.platformName,
    platformShortName: platform.platformShortName,
    platformDescription: platform.platformDescription,
    siteUrl: platform.siteUrl,
    defaultMetaTitle: platform.defaultMetaTitle,
    defaultMetaDescription: platform.defaultMetaDescription,
    ogSiteName: platform.ogSiteName,
    logoUrl: normalizeStoredValue(stored?.logoUrl) || platform.logoUrl,
    logoFullUrl:
      normalizeStoredValue(stored?.logoFullUrl) ||
      normalizeStoredValue(stored?.logoUrl) ||
      platform.logoFullUrl,
    logoFullDarkUrl: normalizeStoredValue(stored?.logoFullDarkUrl),
    logoIconUrl: normalizeStoredValue(stored?.logoIconUrl),
    logoIconDarkUrl: normalizeStoredValue(stored?.logoIconDarkUrl),
    logoOgUrl: normalizeStoredValue(stored?.logoOgUrl),
    logoEmailUrl: normalizeStoredValue(stored?.logoEmailUrl),
    faviconUrl: normalizeStoredValue(stored?.faviconUrl),
    supportEmail: platform.supportEmail,
    emailSenderName: platform.emailSenderName,
    defaultCurrency: platform.defaultCurrency as Currency,
    defaultLanguage: platform.defaultLanguage as Language,
  };
}

function buildSettingsState(
  platform: PlatformConfig,
  stored: PlatformStoredSettings,
): AdminSettingsState {
  return {
    ...DEFAULT_SETTINGS,
    ...toPersistedPlatformState(platform, stored),
  };
}

function resolveBrandAssetPreview(
  settings: Pick<
    AdminSettingsState,
    | "logoUrl"
    | "logoFullUrl"
    | "logoFullDarkUrl"
    | "logoIconUrl"
    | "logoIconDarkUrl"
    | "logoOgUrl"
    | "logoEmailUrl"
    | "faviconUrl"
  >,
  field: BrandAssetFieldKey,
) {
  const fullLogo =
    settings.logoFullUrl || settings.logoUrl || PLATFORM_DEFAULTS.logoFullUrl;
  const fullDarkLogo =
    settings.logoFullDarkUrl || fullLogo || PLATFORM_DEFAULTS.logoFullDarkUrl;
  const iconLogo =
    settings.logoIconUrl || fullLogo || PLATFORM_DEFAULTS.logoIconUrl;
  const iconDarkLogo =
    settings.logoIconDarkUrl ||
    settings.logoIconUrl ||
    fullDarkLogo ||
    iconLogo ||
    PLATFORM_DEFAULTS.logoIconDarkUrl;

  switch (field) {
    case "logoFullUrl":
      return { value: fullLogo, inheritedLabel: null };
    case "logoFullDarkUrl":
      return {
        value: fullDarkLogo,
        inheritedLabel: settings.logoFullDarkUrl
          ? null
          : "Using the default full logo until a dedicated dark-surface logo is uploaded.",
      };
    case "logoIconUrl":
      return {
        value: settings.logoIconUrl || iconLogo,
        inheritedLabel: settings.logoIconUrl
          ? null
          : "Using full logo until an icon logo is uploaded.",
      };
    case "logoIconDarkUrl":
      return {
        value: iconDarkLogo,
        inheritedLabel: settings.logoIconDarkUrl
          ? null
          : "Using the dark full logo until a dedicated dark icon logo is uploaded.",
      };
    case "logoOgUrl":
      return {
        value: settings.logoOgUrl || fullLogo || PLATFORM_DEFAULTS.logoOgUrl,
        inheritedLabel: settings.logoOgUrl
          ? null
          : "Using full logo until an Open Graph logo is uploaded.",
      };
    case "logoEmailUrl":
      return {
        value:
          settings.logoEmailUrl || fullLogo || PLATFORM_DEFAULTS.logoEmailUrl,
        inheritedLabel: settings.logoEmailUrl
          ? null
          : "Using full logo until an email logo is uploaded.",
      };
    case "faviconUrl":
      return {
        value: settings.faviconUrl || iconLogo || PLATFORM_DEFAULTS.faviconUrl,
        inheritedLabel: settings.faviconUrl
          ? null
          : "Using icon logo until a favicon is uploaded.",
      };
  }
}

function getPersistedSettingsFromState(
  settings: PersistedPlatformState,
): PersistedPlatformState {
  return {
    platformName: settings.platformName,
    platformShortName: settings.platformShortName,
    platformDescription: settings.platformDescription,
    siteUrl: settings.siteUrl,
    defaultMetaTitle: settings.defaultMetaTitle,
    defaultMetaDescription: settings.defaultMetaDescription,
    ogSiteName: settings.ogSiteName,
    logoUrl: settings.logoUrl,
    logoFullUrl: settings.logoFullUrl,
    logoFullDarkUrl: settings.logoFullDarkUrl,
    logoIconUrl: settings.logoIconUrl,
    logoIconDarkUrl: settings.logoIconDarkUrl,
    logoOgUrl: settings.logoOgUrl,
    logoEmailUrl: settings.logoEmailUrl,
    faviconUrl: settings.faviconUrl,
    supportEmail: settings.supportEmail,
    emailSenderName: settings.emailSenderName,
    defaultCurrency: settings.defaultCurrency,
    defaultLanguage: settings.defaultLanguage,
  };
}

interface AdminSettingsClientProps {
  initialPlatformSettings: PlatformConfig;
  initialStoredSettings: PlatformStoredSettings;
}

export function AdminSettingsClient({
  initialPlatformSettings,
  initialStoredSettings,
}: AdminSettingsClientProps) {
  const initialPersistedState = useMemo(
    () => toPersistedPlatformState(initialPlatformSettings, initialStoredSettings),
    [initialPlatformSettings, initialStoredSettings],
  );
  const [persistedPlatform, setPersistedPlatform] =
    useState<PersistedPlatformState>(initialPersistedState);
  const [settings, setSettings] = useState<AdminSettingsState>(
    buildSettingsState(initialPlatformSettings, initialStoredSettings),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] =
    useState<BrandAssetFieldKey | null>(null);
  const [brandAssetErrors, setBrandAssetErrors] = useState<
    Partial<Record<BrandAssetFieldKey, string>>
  >({});
  const { toast } = useToast();

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = e.target;

    setSettings((prev) => {
      if (!(name in prev)) return prev;

      const current = prev[name as keyof AdminSettingsState];

      if (type === "number") {
        const num = value === "" ? 0 : Number(value);
        if (Number.isNaN(num)) return prev;
        return { ...prev, [name]: num };
      }

      if (typeof current === "boolean") {
        return { ...prev, [name]: value === "true" };
      }

      return { ...prev, [name]: value };
    });
  }

  function handleToggleChange<K extends keyof AdminSettingsState>(key: K) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key] as AdminSettingsState[K],
    }));
  }

  function handleReset() {
    setSettings({
      ...DEFAULT_SETTINGS,
      ...persistedPlatform,
    });
  }

  async function persistPlatformSettings(
    nextSettings: PersistedPlatformState,
  ) {
    try {
      const response = await fetch("/api/admin/settings/platform", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nextSettings.platformName,
          description: nextSettings.platformDescription,
          shortName: nextSettings.platformShortName,
          siteUrl: nextSettings.siteUrl,
          defaultMetaTitle: nextSettings.defaultMetaTitle,
          defaultMetaDescription: nextSettings.defaultMetaDescription,
          ogSiteName: nextSettings.ogSiteName,
          logoUrl: nextSettings.logoUrl,
          logoFullUrl: nextSettings.logoFullUrl,
          logoFullDarkUrl: nextSettings.logoFullDarkUrl,
          logoIconUrl: nextSettings.logoIconUrl,
          logoIconDarkUrl: nextSettings.logoIconDarkUrl,
          logoOgUrl: nextSettings.logoOgUrl,
          logoEmailUrl: nextSettings.logoEmailUrl,
          faviconUrl: nextSettings.faviconUrl,
          supportEmail: nextSettings.supportEmail,
          emailSenderName: nextSettings.emailSenderName,
          defaultCurrency: nextSettings.defaultCurrency,
          defaultLanguage: nextSettings.defaultLanguage,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to save platform settings.");
      }

      const nextPersisted = getPersistedSettingsFromState(nextSettings);
      setPersistedPlatform(nextPersisted);
      setSettings((prev) => ({
        ...prev,
        ...nextPersisted,
      }));
      return nextPersisted;
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Unable to save platform settings.");
    }
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      await persistPlatformSettings(getPersistedSettingsFromState(settings));
      toast.success("Platform settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBrandAssetUpload(
    field: BrandAssetFieldKey,
    file: File,
  ) {
    setBrandAssetErrors((prev) => ({ ...prev, [field]: null }));
    setUploadingAsset(field);

    try {
      const uploadBody = new FormData();
      uploadBody.append("file", file);

      const uploadResponse = await fetch("/api/admin/upload/logo", {
        method: "POST",
        body: uploadBody,
      });
      const uploadPayload = await uploadResponse.json();

      if (!uploadResponse.ok || typeof uploadPayload?.url !== "string") {
        throw new Error(uploadPayload?.error ?? "Unable to upload logo.");
      }

      const nextSettings: AdminSettingsState = {
        ...settings,
        [field]: uploadPayload.url,
        ...(field === "logoFullUrl" ? { logoUrl: uploadPayload.url } : {}),
      };

      await persistPlatformSettings(getPersistedSettingsFromState(nextSettings));
      setBrandAssetErrors((prev) => ({ ...prev, [field]: null }));
      toast.success("Brand asset uploaded");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to upload logo.";
      setBrandAssetErrors((prev) => ({ ...prev, [field]: message }));
      toast.error(message);
    } finally {
      setUploadingAsset(null);
    }
  }

  return (
    <PageContent className="max-w-[1180px] space-y-6 lg:space-y-8">
      <SectionHeader
        title="Settings"
        description="Manage global platform branding and metadata. Other sections stay local-only for now."
      />

      <div className="space-y-0 rounded-2xl border border-border bg-card px-6 py-6 shadow-card sm:px-7 sm:py-7">
        <FormSection
          title="General"
          description="Persisted platform settings used across branding, metadata, and support surfaces."
          contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <label htmlFor="platformName" className="text-sm font-medium text-foreground">
              Platform Name
            </label>
            <Input
              id="platformName"
              name="platformName"
              value={settings.platformName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="platformShortName" className="text-sm font-medium text-foreground">
              Short Name
            </label>
            <Input
              id="platformShortName"
              name="platformShortName"
              value={settings.platformShortName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="supportEmail" className="text-sm font-medium text-foreground">
              Support Email
            </label>
            <Input
              id="supportEmail"
              type="email"
              name="supportEmail"
              value={settings.supportEmail}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="platformDescription"
              className="text-sm font-medium text-foreground"
            >
              Platform Description
            </label>
            <Textarea
              id="platformDescription"
              name="platformDescription"
              rows={3}
              value={settings.platformDescription}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="siteUrl" className="text-sm font-medium text-foreground">
              Site URL
            </label>
            <Input
              id="siteUrl"
              name="siteUrl"
              value={settings.siteUrl}
              onChange={handleInputChange}
              placeholder="https://www.example.com"
            />
            <p className="text-caption text-muted-foreground">
              Used for canonical metadata, social URLs, and other platform-level references.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="defaultCurrency" className="text-sm font-medium text-foreground">
              Default Currency
            </label>
            <Select
              id="defaultCurrency"
              name="defaultCurrency"
              value={settings.defaultCurrency}
              onChange={handleInputChange}
            >
              <option value="THB">THB – Thai Baht</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="timezone" className="text-sm font-medium text-foreground">
              Timezone
            </label>
            <Select
              id="timezone"
              name="timezone"
              value={settings.timezone}
              onChange={handleInputChange}
            >
              <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="currencyDisplayFormat"
              className="text-sm font-medium text-foreground"
            >
              Currency Display Format
            </label>
            <Select
              id="currencyDisplayFormat"
              name="currencyDisplayFormat"
              value={settings.currencyDisplayFormat}
              onChange={handleInputChange}
            >
              <option value="symbol" className="font-thai">
                THB 199
              </option>
              <option value="thai_text" className="font-thai">
                199 บาท
              </option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="defaultLanguage"
              className="text-sm font-medium text-foreground"
            >
              Default Language
            </label>
            <Select
              id="defaultLanguage"
              name="defaultLanguage"
              value={settings.defaultLanguage}
              onChange={handleInputChange}
            >
              <option value="th">Thai</option>
              <option value="en">English</option>
            </Select>
          </div>
        </FormSection>

        <FormSection
          title="Brand Assets"
          description="Manage dedicated logo assets for navigation, dark surfaces, social previews, email, and browser surfaces."
          contentClassName="grid grid-cols-1 gap-4 xl:grid-cols-2"
        >
          <BrandAssetField
            label="Full Logo"
            helperText="Used in desktop navigation and wide brand areas."
            value={settings.logoFullUrl}
            previewValue={resolveBrandAssetPreview(settings, "logoFullUrl").value}
            platformName={settings.platformName}
            previewVariant="wide"
            isUploading={uploadingAsset === "logoFullUrl"}
            error={brandAssetErrors.logoFullUrl}
            onUpload={(file) => handleBrandAssetUpload("logoFullUrl", file)}
          />
          <BrandAssetField
            label="Full Logo (Dark)"
            helperText="Used on dark surfaces before paint, including dark theme navigation and auth shells."
            value={settings.logoFullDarkUrl}
            previewValue={resolveBrandAssetPreview(settings, "logoFullDarkUrl").value}
            inheritedLabel={resolveBrandAssetPreview(settings, "logoFullDarkUrl").inheritedLabel}
            platformName={settings.platformName}
            previewVariant="wide"
            previewTone="dark"
            isUploading={uploadingAsset === "logoFullDarkUrl"}
            error={brandAssetErrors.logoFullDarkUrl}
            onUpload={(file) => handleBrandAssetUpload("logoFullDarkUrl", file)}
          />
          <BrandAssetField
            label="Icon Logo"
            helperText="Used in mobile navigation, compact layouts, and fallback marks."
            value={settings.logoIconUrl}
            previewValue={resolveBrandAssetPreview(settings, "logoIconUrl").value}
            inheritedLabel={resolveBrandAssetPreview(settings, "logoIconUrl").inheritedLabel}
            platformName={settings.platformName}
            previewVariant="square"
            isUploading={uploadingAsset === "logoIconUrl"}
            error={brandAssetErrors.logoIconUrl}
            onUpload={(file) => handleBrandAssetUpload("logoIconUrl", file)}
          />
          <BrandAssetField
            label="Icon Logo (Dark)"
            helperText="Used in compact dark-theme navigation and mobile brand surfaces."
            value={settings.logoIconDarkUrl}
            previewValue={resolveBrandAssetPreview(settings, "logoIconDarkUrl").value}
            inheritedLabel={resolveBrandAssetPreview(settings, "logoIconDarkUrl").inheritedLabel}
            platformName={settings.platformName}
            previewVariant="square"
            previewTone="dark"
            isUploading={uploadingAsset === "logoIconDarkUrl"}
            error={brandAssetErrors.logoIconDarkUrl}
            onUpload={(file) => handleBrandAssetUpload("logoIconDarkUrl", file)}
          />
          <BrandAssetField
            label="Open Graph Logo"
            helperText="Used for social sharing previews and metadata."
            value={settings.logoOgUrl}
            previewValue={resolveBrandAssetPreview(settings, "logoOgUrl").value}
            inheritedLabel={resolveBrandAssetPreview(settings, "logoOgUrl").inheritedLabel}
            platformName={settings.platformName}
            previewVariant="wide"
            isUploading={uploadingAsset === "logoOgUrl"}
            error={brandAssetErrors.logoOgUrl}
            onUpload={(file) => handleBrandAssetUpload("logoOgUrl", file)}
          />
          <BrandAssetField
            label="Email Logo"
            helperText="Used in email templates. Choose a clean, high-contrast version."
            value={settings.logoEmailUrl}
            previewValue={resolveBrandAssetPreview(settings, "logoEmailUrl").value}
            inheritedLabel={resolveBrandAssetPreview(settings, "logoEmailUrl").inheritedLabel}
            platformName={settings.platformName}
            previewVariant="wide"
            isUploading={uploadingAsset === "logoEmailUrl"}
            error={brandAssetErrors.logoEmailUrl}
            onUpload={(file) => handleBrandAssetUpload("logoEmailUrl", file)}
          />
          <BrandAssetField
            label="Favicon"
            helperText="Used for browser tabs and app icons."
            value={settings.faviconUrl}
            previewValue={resolveBrandAssetPreview(settings, "faviconUrl").value}
            inheritedLabel={resolveBrandAssetPreview(settings, "faviconUrl").inheritedLabel}
            platformName={settings.platformName}
            previewVariant="square"
            isUploading={uploadingAsset === "faviconUrl"}
            error={brandAssetErrors.faviconUrl}
            onUpload={(file) => handleBrandAssetUpload("faviconUrl", file)}
          />
        </FormSection>

        <FormSection
          title="Moderation"
          description="Control how resources and user-generated content are reviewed."
          contentClassName="divide-y divide-border"
        >
          {[
            [
              "autoPublishResources",
              "Auto Publish Resources",
              "If enabled, new resources go live immediately after submission.",
            ],
            [
              "requireReviewBeforePublish",
              "Require Admin Review Before Publish",
              "New resources must be approved by an admin before going live.",
            ],
            [
              "allowUserReviews",
              "Allow User Reviews",
              "Let users leave ratings and reviews on resources.",
            ],
            [
              "allowReportingResources",
              "Allow Reporting Resources",
              "Enable users to report inappropriate or low-quality resources.",
            ],
          ].map(([key, title, description]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-caption text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={Boolean(settings[key as keyof AdminSettingsState])}
                onCheckedChange={() => handleToggleChange(key as keyof AdminSettingsState)}
              />
            </div>
          ))}
        </FormSection>

        <FormSection
          title="Marketplace"
          description="Control pricing rules and publication workflow."
          contentClassName="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="defaultCommission"
              className="text-sm font-medium text-foreground"
            >
              Default Commission (%)
            </label>
            <Input
              id="defaultCommission"
              name="defaultCommission"
              type="number"
              min={0}
              max={100}
              value={settings.defaultCommission}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="minPrice" className="text-sm font-medium text-foreground">
              Minimum Resource Price
            </label>
            <Input
              id="minPrice"
              name="minPrice"
              type="number"
              min={0}
              value={settings.minPrice}
              onChange={handleInputChange}
            />
            <p className="text-caption text-muted-foreground">
              Recommended minimum price for Thai market: 19–29 THB
            </p>
          </div>
        </FormSection>

        <FormSection
          title="Payments"
          description="Configure payment provider and API keys."
          contentClassName="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="paymentProvider"
              className="text-sm font-medium text-foreground"
            >
              Payment Provider
            </label>
            <Select
              id="paymentProvider"
              name="paymentProvider"
              value={settings.paymentProvider}
              onChange={handleInputChange}
            >
              <option value="stripe">Stripe</option>
              <option value="promptpay">PromptPay (Manual)</option>
            </Select>
          </div>

          {settings.paymentProvider === "stripe" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="stripePublicKey"
                  className="text-sm font-medium text-foreground"
                >
                  Stripe Public Key
                </label>
                <Input
                  id="stripePublicKey"
                  name="stripePublicKey"
                  value={settings.stripePublicKey}
                  onChange={handleInputChange}
                  placeholder="pk_live_..."
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="stripeSecretKey"
                  className="text-sm font-medium text-foreground"
                >
                  Stripe Secret Key
                </label>
                <Input
                  id="stripeSecretKey"
                  name="stripeSecretKey"
                  type="password"
                  value={settings.stripeSecretKey}
                  onChange={handleInputChange}
                  placeholder="sk_live_..."
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor="stripeWebhookSecret"
                  className="text-sm font-medium text-foreground"
                >
                  Webhook Secret
                </label>
                <Input
                  id="stripeWebhookSecret"
                  name="stripeWebhookSecret"
                  type="password"
                  value={settings.stripeWebhookSecret}
                  onChange={handleInputChange}
                  placeholder="whsec_..."
                />
              </div>
            </div>
          ) : null}

          {settings.paymentProvider === "promptpay" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="promptpayQrId"
                  className="text-sm font-medium text-foreground"
                >
                  PromptPay QR ID
                </label>
                <Input
                  id="promptpayQrId"
                  name="promptpayQrId"
                  value={settings.promptpayQrId}
                  onChange={handleInputChange}
                  placeholder="Your PromptPay QR ID"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="promptpayPhoneNumber"
                  className="text-sm font-medium text-foreground"
                >
                  PromptPay Phone Number
                </label>
                <Input
                  id="promptpayPhoneNumber"
                  name="promptpayPhoneNumber"
                  value={settings.promptpayPhoneNumber}
                  onChange={handleInputChange}
                  placeholder="0XX-XXX-XXXX"
                />
              </div>
            </div>
          ) : null}
        </FormSection>

        <FormSection
          title="Upload Settings"
          description="Control how files are uploaded and stored."
          contentClassName="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="maxFileSizeMb"
                className="text-sm font-medium text-foreground"
              >
                Max File Size (MB)
              </label>
              <Input
                id="maxFileSizeMb"
                name="maxFileSizeMb"
                type="number"
                min={1}
                value={settings.maxFileSizeMb}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="storageProvider"
                className="text-sm font-medium text-foreground"
              >
                Storage Provider
              </label>
              <Select
                id="storageProvider"
                name="storageProvider"
                value={settings.storageProvider}
                onChange={handleInputChange}
              >
                <option value="local">Local</option>
                <option value="s3">Amazon S3</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="allowedFileTypes"
              className="text-sm font-medium text-foreground"
            >
              Allowed File Types
            </label>
            <Input
              id="allowedFileTypes"
              name="allowedFileTypes"
              placeholder="e.g. pdf, docx, pptx, xlsx, zip"
              value={settings.allowedFileTypes}
              onChange={handleInputChange}
            />
            <p className="text-caption text-muted-foreground">
              Comma-separated list of extensions (without dots).
            </p>
          </div>
        </FormSection>

        <FormSection
          title="Email"
          description="Configure persisted sender identity alongside local-only SMTP details."
          contentClassName="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="emailSenderName"
              className="text-sm font-medium text-foreground"
            >
              Sender Name
            </label>
            <Input
              id="emailSenderName"
              name="emailSenderName"
              value={settings.emailSenderName}
              onChange={handleInputChange}
            />
            <p className="text-caption text-muted-foreground">
              Used as the default sender label for platform emails.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="smtpHost" className="text-sm font-medium text-foreground">
              SMTP Host
            </label>
            <Input
              id="smtpHost"
              name="smtpHost"
              value={settings.smtpHost}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="smtpPort" className="text-sm font-medium text-foreground">
              SMTP Port
            </label>
            <Input
              id="smtpPort"
              name="smtpPort"
              type="number"
              min={1}
              value={settings.smtpPort}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="smtpUsername"
              className="text-sm font-medium text-foreground"
            >
              SMTP Username
            </label>
            <Input
              id="smtpUsername"
              name="smtpUsername"
              value={settings.smtpUsername}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="smtpPassword"
              className="text-sm font-medium text-foreground"
            >
              SMTP Password
            </label>
            <Input
              id="smtpPassword"
              name="smtpPassword"
              type="password"
              value={settings.smtpPassword}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="smtpFromEmail"
              className="text-sm font-medium text-foreground"
            >
              From Email
            </label>
            <Input
              id="smtpFromEmail"
              name="smtpFromEmail"
              type="email"
              value={settings.smtpFromEmail}
              onChange={handleInputChange}
            />
          </div>
        </FormSection>

        <FormSection
          title="SEO"
          description="Persisted base metadata used across the app, plus optional local-only social image fields."
          contentClassName="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="defaultMetaTitle"
              className="text-sm font-medium text-foreground"
            >
              Default Meta Title
            </label>
            <Input
              id="defaultMetaTitle"
              name="defaultMetaTitle"
              value={settings.defaultMetaTitle}
              onChange={handleInputChange}
              placeholder={PLATFORM_DEFAULTS.defaultMetaTitle}
              className="font-thai"
            />
            <p className="text-caption text-muted-foreground">
              Used as the main title in browser tabs and search results.
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="defaultMetaDescription"
              className="text-sm font-medium text-foreground"
            >
              Default Meta Description
            </label>
            <Textarea
              id="defaultMetaDescription"
              name="defaultMetaDescription"
              rows={3}
              value={settings.defaultMetaDescription}
              onChange={handleInputChange}
              placeholder={PLATFORM_DEFAULTS.defaultMetaDescription}
              className="font-thai"
            />
            <p className="text-caption text-muted-foreground">
              Short description shown in search results; aim for 120–160 characters.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ogSiteName" className="text-sm font-medium text-foreground">
              Open Graph Site Name
            </label>
            <Input
              id="ogSiteName"
              name="ogSiteName"
              value={settings.ogSiteName}
              onChange={handleInputChange}
              placeholder={PLATFORM_DEFAULTS.ogSiteName}
            />
            <p className="text-caption text-muted-foreground">
              Shown as the site name in social previews when pages inherit base Open Graph metadata.
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="seoOpenGraphImageUrl"
              className="text-sm font-medium text-foreground"
            >
              OpenGraph Image URL
            </label>
            <Input
              id="seoOpenGraphImageUrl"
              name="seoOpenGraphImageUrl"
              value={settings.seoOpenGraphImageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-caption text-muted-foreground">
              Image used when sharing your site on social platforms (Open Graph).
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="seoTwitterCardImageUrl"
              className="text-sm font-medium text-foreground"
            >
              Twitter Card Image
            </label>
            <Input
              id="seoTwitterCardImageUrl"
              name="seoTwitterCardImageUrl"
              value={settings.seoTwitterCardImageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/twitter-card.jpg"
            />
            <p className="text-caption text-muted-foreground">
              Image used for Twitter/X cards; can match your OpenGraph image.
            </p>
          </div>
        </FormSection>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-card backdrop-blur">
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button type="button" onClick={handleSave} loading={isSaving}>
          Save Platform Settings
        </Button>
      </div>
    </PageContent>
  );
}
