"use client";

import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  PageContent,
  Select,
  Switch,
  Textarea,
} from "@/design-system";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BrandAssetField } from "@/components/admin/settings/BrandAssetField";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { PLATFORM_DEFAULTS } from "@/lib/platform/platform-defaults";
import type { PlatformConfig } from "@/lib/platform/platform.types";
import { routes } from "@/lib/routes";

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
  logoIconUrl: string;
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
  | "logoIconUrl"
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
  | "logoIconUrl"
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
  logoIconUrl: PLATFORM_DEFAULTS.logoIconUrl,
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

function toPersistedPlatformState(
  platform: PlatformConfig,
): PersistedPlatformState {
  return {
    platformName: platform.platformName,
    platformShortName: platform.platformShortName,
    platformDescription: platform.platformDescription,
    siteUrl: platform.siteUrl,
    defaultMetaTitle: platform.defaultMetaTitle,
    defaultMetaDescription: platform.defaultMetaDescription,
    ogSiteName: platform.ogSiteName,
    logoUrl: platform.logoUrl,
    logoFullUrl: platform.logoFullUrl,
    logoIconUrl: platform.logoIconUrl,
    logoOgUrl: platform.logoOgUrl,
    logoEmailUrl: platform.logoEmailUrl,
    faviconUrl: platform.faviconUrl,
    supportEmail: platform.supportEmail,
    emailSenderName: platform.emailSenderName,
    defaultCurrency: platform.defaultCurrency as Currency,
    defaultLanguage: platform.defaultLanguage as Language,
  };
}

function buildSettingsState(platform: PlatformConfig): AdminSettingsState {
  return {
    ...DEFAULT_SETTINGS,
    ...toPersistedPlatformState(platform),
  };
}

function getPersistedSettingsFromState(
  settings: AdminSettingsState,
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
    logoIconUrl: settings.logoIconUrl,
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
}

export function AdminSettingsClient({
  initialPlatformSettings,
}: AdminSettingsClientProps) {
  const initialPersistedState = useMemo(
    () => toPersistedPlatformState(initialPlatformSettings),
    [initialPlatformSettings],
  );
  const [persistedPlatform, setPersistedPlatform] =
    useState<PersistedPlatformState>(initialPersistedState);
  const [settings, setSettings] = useState<AdminSettingsState>(
    buildSettingsState(initialPlatformSettings),
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
    nextSettings: Pick<
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
      | "logoIconUrl"
      | "logoOgUrl"
      | "logoEmailUrl"
      | "faviconUrl"
      | "supportEmail"
      | "emailSenderName"
      | "defaultCurrency"
      | "defaultLanguage"
    >,
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
          logoIconUrl: nextSettings.logoIconUrl,
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

      const nextPersisted = toPersistedPlatformState(payload as PlatformConfig);
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

      <Card className="flex flex-col gap-4 rounded-2xl p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Typography
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Global typography now lives in a dedicated editor with live
            preview, preset controls, and script-aware font overrides.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={routes.adminTypographySettings}>
            Open typography settings
          </Link>
        </Button>
      </Card>

      <Card className="space-y-6 rounded-2xl p-6 shadow-card sm:p-7">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">General</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Persisted platform settings used across branding, metadata, and support surfaces.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="platformName" className="text-sm font-medium text-text-primary">
              Platform Name
            </label>
            <Input id="platformName" name="platformName" value={settings.platformName} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="platformShortName" className="text-sm font-medium text-text-primary">
              Short Name
            </label>
            <Input id="platformShortName" name="platformShortName" value={settings.platformShortName} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="supportEmail" className="text-sm font-medium text-text-primary">
              Support Email
            </label>
            <Input id="supportEmail" type="email" name="supportEmail" value={settings.supportEmail} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="platformDescription" className="text-sm font-medium text-text-primary">
              Platform Description
            </label>
            <Textarea id="platformDescription" name="platformDescription" rows={3} value={settings.platformDescription} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="siteUrl" className="text-sm font-medium text-text-primary">
              Site URL
            </label>
            <Input id="siteUrl" name="siteUrl" value={settings.siteUrl} onChange={handleInputChange} placeholder="https://www.example.com" />
            <p className="text-xs text-text-muted">Used for canonical metadata, social URLs, and other platform-level references.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="defaultCurrency" className="text-sm font-medium text-text-primary">
              Default Currency
            </label>
            <Select id="defaultCurrency" name="defaultCurrency" value={settings.defaultCurrency} onChange={handleInputChange}>
              <option value="THB">THB – Thai Baht</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="timezone" className="text-sm font-medium text-text-primary">
              Timezone
            </label>
            <Select id="timezone" name="timezone" value={settings.timezone} onChange={handleInputChange}>
              <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="currencyDisplayFormat" className="text-sm font-medium text-text-primary">
              Currency Display Format
            </label>
            <Select id="currencyDisplayFormat" name="currencyDisplayFormat" value={settings.currencyDisplayFormat} onChange={handleInputChange}>
              <option value="symbol" className="font-thai">THB 199</option>
              <option value="thai_text" className="font-thai">199 บาท</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="defaultLanguage" className="text-sm font-medium text-text-primary">
              Default Language
            </label>
            <Select id="defaultLanguage" name="defaultLanguage" value={settings.defaultLanguage} onChange={handleInputChange}>
              <option value="th">Thai</option>
              <option value="en">English</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="space-y-6 rounded-2xl p-6 shadow-card sm:p-7">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Brand Assets</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Manage dedicated logo assets for navigation, social previews, email, and browser surfaces.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <BrandAssetField
            label="Full Logo"
            helperText="Used in desktop navigation and wide brand areas."
            value={settings.logoFullUrl}
            platformName={settings.platformName}
            previewVariant="wide"
            isUploading={uploadingAsset === "logoFullUrl"}
            error={brandAssetErrors.logoFullUrl}
            onUpload={(file) => handleBrandAssetUpload("logoFullUrl", file)}
          />
          <BrandAssetField
            label="Icon Logo"
            helperText="Used in mobile navigation, compact layouts, and fallback marks."
            value={settings.logoIconUrl}
            platformName={settings.platformName}
            previewVariant="square"
            isUploading={uploadingAsset === "logoIconUrl"}
            error={brandAssetErrors.logoIconUrl}
            onUpload={(file) => handleBrandAssetUpload("logoIconUrl", file)}
          />
          <BrandAssetField
            label="Open Graph Logo"
            helperText="Used for social sharing previews and metadata."
            value={settings.logoOgUrl}
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
            platformName={settings.platformName}
            previewVariant="square"
            isUploading={uploadingAsset === "faviconUrl"}
            error={brandAssetErrors.faviconUrl}
            onUpload={(file) => handleBrandAssetUpload("faviconUrl", file)}
          />
        </div>
      </Card>

      <Card className="space-y-6 rounded-2xl p-6 shadow-card sm:p-7">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Moderation</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Control how resources and user-generated content are reviewed.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ["autoPublishResources", "Auto Publish Resources", "If enabled, new resources go live immediately after submission."],
            ["requireReviewBeforePublish", "Require Admin Review Before Publish", "New resources must be approved by an admin before going live."],
            ["allowUserReviews", "Allow User Reviews", "Let users leave ratings and reviews on resources."],
            ["allowReportingResources", "Allow Reporting Resources", "Enable users to report inappropriate or low-quality resources."],
          ].map(([key, title, description]) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{title}</p>
                <p className="text-xs text-text-secondary">{description}</p>
              </div>
              <Switch
                checked={Boolean(settings[key as keyof AdminSettingsState])}
                onCheckedChange={() => handleToggleChange(key as keyof AdminSettingsState)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-6 rounded-2xl p-6 shadow-card sm:p-7">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Marketplace</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Control pricing rules and publication workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="defaultCommission" className="text-sm font-medium text-text-primary">
              Default Commission (%)
            </label>
            <Input id="defaultCommission" name="defaultCommission" type="number" min={0} max={100} value={settings.defaultCommission} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="minPrice" className="text-sm font-medium text-text-primary">
              Minimum Resource Price
            </label>
            <Input id="minPrice" name="minPrice" type="number" min={0} value={settings.minPrice} onChange={handleInputChange} />
            <p className="text-xs text-text-muted">Recommended minimum price for Thai market: 19–29 THB</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-6 rounded-2xl p-6 shadow-card sm:p-7">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Payments</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Configure payment provider and API keys.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="paymentProvider" className="text-sm font-medium text-text-primary">
              Payment Provider
            </label>
            <Select id="paymentProvider" name="paymentProvider" value={settings.paymentProvider} onChange={handleInputChange}>
              <option value="stripe">Stripe</option>
              <option value="promptpay">PromptPay (Manual)</option>
            </Select>
          </div>

          {settings.paymentProvider === "stripe" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="stripePublicKey" className="text-sm font-medium text-text-primary">Stripe Public Key</label>
                <Input id="stripePublicKey" name="stripePublicKey" value={settings.stripePublicKey} onChange={handleInputChange} placeholder="pk_live_..." />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="stripeSecretKey" className="text-sm font-medium text-text-primary">Stripe Secret Key</label>
                <Input id="stripeSecretKey" name="stripeSecretKey" type="password" value={settings.stripeSecretKey} onChange={handleInputChange} placeholder="sk_live_..." />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="stripeWebhookSecret" className="text-sm font-medium text-text-primary">Webhook Secret</label>
                <Input id="stripeWebhookSecret" name="stripeWebhookSecret" type="password" value={settings.stripeWebhookSecret} onChange={handleInputChange} placeholder="whsec_..." />
              </div>
            </div>
          )}

          {settings.paymentProvider === "promptpay" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="promptpayQrId" className="text-sm font-medium text-text-primary">PromptPay QR ID</label>
                <Input id="promptpayQrId" name="promptpayQrId" value={settings.promptpayQrId} onChange={handleInputChange} placeholder="Your PromptPay QR ID" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="promptpayPhoneNumber" className="text-sm font-medium text-text-primary">PromptPay Phone Number</label>
                <Input id="promptpayPhoneNumber" name="promptpayPhoneNumber" value={settings.promptpayPhoneNumber} onChange={handleInputChange} placeholder="0XX-XXX-XXXX" />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-6 rounded-2xl p-6 shadow-card sm:p-7">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Upload Settings</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Control how files are uploaded and stored.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="maxFileSizeMb" className="text-sm font-medium text-text-primary">Max File Size (MB)</label>
            <Input id="maxFileSizeMb" name="maxFileSizeMb" type="number" min={1} value={settings.maxFileSizeMb} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="storageProvider" className="text-sm font-medium text-text-primary">Storage Provider</label>
            <Select id="storageProvider" name="storageProvider" value={settings.storageProvider} onChange={handleInputChange}>
              <option value="local">Local</option>
              <option value="s3">Amazon S3</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="allowedFileTypes" className="text-sm font-medium text-text-primary">Allowed File Types</label>
          <Input id="allowedFileTypes" name="allowedFileTypes" placeholder="e.g. pdf, docx, pptx, xlsx, zip" value={settings.allowedFileTypes} onChange={handleInputChange} />
          <p className="text-xs text-text-muted">Comma-separated list of extensions (without dots).</p>
        </div>
      </Card>

      <Card className="space-y-6 rounded-2xl p-6 shadow-card sm:p-7">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Email</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Configure persisted sender identity alongside local-only SMTP details.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="emailSenderName" className="text-sm font-medium text-text-primary">Sender Name</label>
            <Input id="emailSenderName" name="emailSenderName" value={settings.emailSenderName} onChange={handleInputChange} />
            <p className="text-xs text-text-muted">Used as the default sender label for platform emails.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="smtpHost" className="text-sm font-medium text-text-primary">SMTP Host</label>
            <Input id="smtpHost" name="smtpHost" value={settings.smtpHost} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="smtpPort" className="text-sm font-medium text-text-primary">SMTP Port</label>
            <Input id="smtpPort" name="smtpPort" type="number" min={1} value={settings.smtpPort} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="smtpUsername" className="text-sm font-medium text-text-primary">SMTP Username</label>
            <Input id="smtpUsername" name="smtpUsername" value={settings.smtpUsername} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="smtpPassword" className="text-sm font-medium text-text-primary">SMTP Password</label>
            <Input id="smtpPassword" name="smtpPassword" type="password" value={settings.smtpPassword} onChange={handleInputChange} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="smtpFromEmail" className="text-sm font-medium text-text-primary">From Email</label>
            <Input id="smtpFromEmail" name="smtpFromEmail" type="email" value={settings.smtpFromEmail} onChange={handleInputChange} />
          </div>
        </div>
      </Card>

      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">SEO</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Persisted base metadata used across the app, plus optional local-only social image fields.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="defaultMetaTitle" className="text-sm font-medium text-text-primary">Default Meta Title</label>
            <Input id="defaultMetaTitle" name="defaultMetaTitle" value={settings.defaultMetaTitle} onChange={handleInputChange} placeholder={PLATFORM_DEFAULTS.defaultMetaTitle} className="font-thai" />
            <p className="text-xs text-text-muted">Used as the main title in browser tabs and search results.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="defaultMetaDescription" className="text-sm font-medium text-text-primary">Default Meta Description</label>
            <Textarea id="defaultMetaDescription" name="defaultMetaDescription" rows={3} value={settings.defaultMetaDescription} onChange={handleInputChange} placeholder={PLATFORM_DEFAULTS.defaultMetaDescription} className="font-thai" />
            <p className="text-xs text-text-muted">Short description shown in search results; aim for 120–160 characters.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ogSiteName" className="text-sm font-medium text-text-primary">Open Graph Site Name</label>
            <Input id="ogSiteName" name="ogSiteName" value={settings.ogSiteName} onChange={handleInputChange} placeholder={PLATFORM_DEFAULTS.ogSiteName} />
            <p className="text-xs text-text-muted">Shown as the site name in social previews when pages inherit base Open Graph metadata.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="seoOpenGraphImageUrl" className="text-sm font-medium text-text-primary">OpenGraph Image URL</label>
            <Input id="seoOpenGraphImageUrl" name="seoOpenGraphImageUrl" value={settings.seoOpenGraphImageUrl} onChange={handleInputChange} placeholder="https://example.com/og-image.jpg" />
            <p className="text-xs text-text-muted">Image used when sharing your site on social platforms (Open Graph).</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="seoTwitterCardImageUrl" className="text-sm font-medium text-text-primary">Twitter Card Image</label>
            <Input id="seoTwitterCardImageUrl" name="seoTwitterCardImageUrl" value={settings.seoTwitterCardImageUrl} onChange={handleInputChange} placeholder="https://example.com/twitter-card.jpg" />
            <p className="text-xs text-text-muted">Image used for Twitter/X cards; can match your OpenGraph image.</p>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-surface-200 bg-white/95 p-3 shadow-card backdrop-blur">
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
