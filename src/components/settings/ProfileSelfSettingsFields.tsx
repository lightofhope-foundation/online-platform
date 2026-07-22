"use client";

import { DisplayNameField } from "./DisplayNameField";

type ProfileSelfSettingsFieldsProps = {
  displayNameId: string;
  phoneId: string;
  displayName: string;
  phoneNumber: string;
  onDisplayNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  displayNameSuggestion?: string;
  showBookingLinks?: boolean;
  zoomMeetingUrl?: string;
  calendlyUrl?: string;
  onZoomMeetingUrlChange?: (value: string) => void;
  onCalendlyUrlChange?: (value: string) => void;
};

export function ProfileSelfSettingsFields({
  displayNameId,
  phoneId,
  displayName,
  phoneNumber,
  onDisplayNameChange,
  onPhoneNumberChange,
  displayNameSuggestion,
  showBookingLinks,
  zoomMeetingUrl = "",
  calendlyUrl = "",
  onZoomMeetingUrlChange,
  onCalendlyUrlChange,
}: ProfileSelfSettingsFieldsProps) {
  return (
    <div className="space-y-4">
      <DisplayNameField
        id={displayNameId}
        value={displayName}
        onChange={onDisplayNameChange}
        suggestion={displayNameSuggestion}
      />
      <div>
        <label htmlFor={phoneId} className="mb-1.5 block text-xs text-white/50">
          Handynummer
        </label>
        <input
          id={phoneId}
          type="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder="+49 170 1234567"
          autoComplete="tel"
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
        />
        <p className="mt-1 text-xs text-white/40">
          Optional. Wird z. B. Ihrem Therapeuten oder Klienten in der Sitzungsansicht
          angezeigt (sofern freigegeben).
        </p>
      </div>
      {showBookingLinks && onZoomMeetingUrlChange && onCalendlyUrlChange ? (
        <>
          <div>
            <label htmlFor={`${phoneId}-zoom`} className="mb-1.5 block text-xs text-white/50">
              Zoom-Meeting-Link
            </label>
            <input
              id={`${phoneId}-zoom`}
              type="url"
              value={zoomMeetingUrl}
              onChange={(e) => onZoomMeetingUrlChange(e.target.value)}
              placeholder="https://zoom.us/j/…"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
            />
          </div>
          <div>
            <label htmlFor={`${phoneId}-calendly`} className="mb-1.5 block text-xs text-white/50">
              Calendly-Link
            </label>
            <input
              id={`${phoneId}-calendly`}
              type="url"
              value={calendlyUrl}
              onChange={(e) => onCalendlyUrlChange(e.target.value)}
              placeholder="https://calendly.com/…"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
            />
            <p className="mt-1 text-xs text-white/40">
              Persönlicher Dauerlink für Terminbuchungen (Zoom / Calendly).
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
