"use client";

import React, { useState } from "react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  Input,
  Textarea,
  Select,
  Switch,
} from "@/components/ui/forms";
import { useToast } from "@/hooks/use-toast";

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
  // General
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  defaultCurrency: Currency;
  timezone: Timezone;
  currencyDisplayFormat: CurrencyDisplayFormat;
  defaultLanguage: Language;
  // Marketplace
  defaultCommission: number;
  minPrice: number;
  allowFreeResources: boolean;
  requireReviewBeforePublish: boolean;
  // Moderation
  autoPublishResources: boolean;
  allowUserReviews: boolean;
  allowReportingResources: boolean;
  // Payments
  paymentProvider: PaymentProvider;
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  promptpayQrId: string;
  promptpayPhoneNumber: string;
  // Upload
  maxFileSizeMb: number;
  allowedFileTypes: string;
  storageProvider: StorageProvider;
  // Email
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  // SEO
  seoSiteTitle: string;
  seoMetaDescription: string;
  seoOpenGraphImageUrl: string;
  seoTwitterCardImageUrl: string;
}

const DEFAULT_SETTINGS: AdminSettingsState = {
  platformName: "PaperDock",
  platformDescription:
    "A marketplace for high-quality downloadable study resources.",
  supportEmail: "support@paperdock.app",
  defaultCurrency: "THB",
  timezone: "Asia/Bangkok",
  currencyDisplayFormat: "symbol",
  defaultLanguage: "th",
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
  smtpFromEmail: "no-reply@paperdock.app",
  seoSiteTitle: "PaperDock – แหล่งรวมเอกสารการเรียนคุณภาพสูง",
  seoMetaDescription: "Marketplace สำหรับเอกสารการเรียน worksheet และ study resources",
  seoOpenGraphImageUrl: "",
  seoTwitterCardImageUrl: "",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingsState>(DEFAULT_SETTINGS);
  const { toast } = useToast();

  function handleFieldChange<K extends keyof AdminSettingsState>(
    key: K,
    value: AdminSettingsState[K],
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
    setSettings(DEFAULT_SETTINGS);
  }

  function handleSave() {
    // Placeholder for future API integration
    // eslint-disable-next-line no-console
    console.log("Admin settings saved (local only):", settings);
    toast.success("Settings saved");
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <SectionHeader
        title="Settings"
        description="Configure marketplace platform settings."
      />

      {/* General */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">General</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Basic information about your marketplace.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="platformName"
              className="text-sm font-medium text-text-primary"
            >
              Platform Name
            </label>
            <Input
              id="platformName"
              name="platformName"
              value={settings.platformName}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="platformDescription"
              className="text-sm font-medium text-text-primary"
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
          <div className="space-y-1.5">
            <label
              htmlFor="supportEmail"
              className="text-sm font-medium text-text-primary"
            >
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
          <div className="space-y-1.5">
            <label
              htmlFor="defaultCurrency"
              className="text-sm font-medium text-text-primary"
            >
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
            <label
              htmlFor="timezone"
              className="text-sm font-medium text-text-primary"
            >
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
            </Select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="currencyDisplayFormat"
              className="text-sm font-medium text-text-primary"
            >
              Currency Display Format
            </label>
            <Select
              id="currencyDisplayFormat"
              name="currencyDisplayFormat"
              value={settings.currencyDisplayFormat}
              onChange={handleInputChange}
            >
              <option value="symbol" className="font-thai">THB 199</option>
              <option value="thai_text" className="font-thai">199 บาท</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="defaultLanguage"
              className="text-sm font-medium text-text-primary"
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
        </div>
      </Card>

      {/* Moderation */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Moderation</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Control how resources and user-generated content are reviewed.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Auto Publish Resources
              </p>
              <p className="text-xs text-text-secondary">
                If enabled, new resources go live immediately after submission.
              </p>
            </div>
            <Switch
              checked={settings.autoPublishResources}
              onCheckedChange={() => handleToggleChange("autoPublishResources")}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Require Admin Review Before Publish
              </p>
              <p className="text-xs text-text-secondary">
                New resources must be approved by an admin before going live.
              </p>
            </div>
            <Switch
              checked={settings.requireReviewBeforePublish}
              onCheckedChange={() =>
                handleToggleChange("requireReviewBeforePublish")
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Allow User Reviews
              </p>
              <p className="text-xs text-text-secondary">
                Let users leave ratings and reviews on resources.
              </p>
            </div>
            <Switch
              checked={settings.allowUserReviews}
              onCheckedChange={() => handleToggleChange("allowUserReviews")}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Allow Reporting Resources
              </p>
              <p className="text-xs text-text-secondary">
                Enable users to report inappropriate or low-quality resources.
              </p>
            </div>
            <Switch
              checked={settings.allowReportingResources}
              onCheckedChange={() =>
                handleToggleChange("allowReportingResources")
              }
            />
          </div>
        </div>
      </Card>

      {/* Marketplace */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Marketplace</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Control pricing rules and publication workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="defaultCommission"
              className="text-sm font-medium text-text-primary"
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
            <label
              htmlFor="minPrice"
              className="text-sm font-medium text-text-primary"
            >
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
            <p className="text-xs text-text-muted">
              Recommended minimum price for Thai market: 19–29 THB
            </p>
          </div>
        </div>
      </Card>

      {/* Payments */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Payments</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Configure payment provider and API keys.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="paymentProvider"
              className="text-sm font-medium text-text-primary"
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

          {settings.paymentProvider === "stripe" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="stripePublicKey"
                  className="text-sm font-medium text-text-primary"
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
                  className="text-sm font-medium text-text-primary"
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
                  className="text-sm font-medium text-text-primary"
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
          )}

          {settings.paymentProvider === "promptpay" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="promptpayQrId"
                  className="text-sm font-medium text-text-primary"
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
                  className="text-sm font-medium text-text-primary"
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
          )}

        </div>
      </Card>

      {/* Upload Settings */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Upload Settings
          </h2>
          <p className="mt-1 text-meta text-text-secondary">
            Control how files are uploaded and stored.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="maxFileSizeMb"
              className="text-sm font-medium text-text-primary"
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
              className="text-sm font-medium text-text-primary"
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
            className="text-sm font-medium text-text-primary"
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
          <p className="text-xs text-text-muted">
            Comma-separated list of extensions (without dots).
          </p>
        </div>
      </Card>

      {/* Email */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Email</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Configure SMTP details for transactional emails.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="smtpHost"
              className="text-sm font-medium text-text-primary"
            >
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
            <label
              htmlFor="smtpPort"
              className="text-sm font-medium text-text-primary"
            >
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
              className="text-sm font-medium text-text-primary"
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
              className="text-sm font-medium text-text-primary"
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
              className="text-sm font-medium text-text-primary"
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
        </div>
      </Card>

      {/* SEO */}
      <Card className="space-y-6 p-6">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">SEO</h2>
          <p className="mt-1 text-meta text-text-secondary">
            Improve how your marketplace appears in search results and social
            shares.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="seoSiteTitle"
              className="text-sm font-medium text-text-primary"
            >
              Site Title
            </label>
            <Input
              id="seoSiteTitle"
              name="seoSiteTitle"
              value={settings.seoSiteTitle}
              onChange={handleInputChange}
              placeholder="PaperDock – แหล่งรวมเอกสารการเรียนคุณภาพสูง"
              className="font-thai"
            />
            <p className="text-xs text-text-muted">
              Used as the main title in browser tabs and search results.
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="seoMetaDescription"
              className="text-sm font-medium text-text-primary"
            >
              Meta Description
            </label>
            <Textarea
              id="seoMetaDescription"
              name="seoMetaDescription"
              rows={3}
              value={settings.seoMetaDescription}
              onChange={handleInputChange}
              placeholder="Marketplace สำหรับเอกสารการเรียน worksheet และ study resources"
              className="font-thai"
            />
            <p className="text-xs text-text-muted">
              Short description shown in search results; aim for 120–160
              characters.
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="seoOpenGraphImageUrl"
              className="text-sm font-medium text-text-primary"
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
            <p className="text-xs text-text-muted">
              Image used when sharing your site on social platforms (Open
              Graph).
            </p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="seoTwitterCardImageUrl"
              className="text-sm font-medium text-text-primary"
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
            <p className="text-xs text-text-muted">
              Image used for Twitter/X cards; can match your OpenGraph image.
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button type="button" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
