export const ADMIN_WORKSPACE='/private/console-0be5626d4305f192e37e/workspace';
export const NOTIFICATION_FAMILIES={registration:{label:'Registrations',icon:'users'},report:{label:'Reports',icon:'flag'},review:{label:'Review requests',icon:'clipboard'},medical:{label:'Medical operations',icon:'heart'},publishing:{label:'Publishing & configuration',icon:'edit'},security:{label:'Security',icon:'shield'},recovery:{label:'Recovery & maintenance',icon:'database'}} as const;
export type NotificationFamily=keyof typeof NOTIFICATION_FAMILIES;
export type NotificationItem={id:string;type:string;family:NotificationFamily;title:string;detail:string;country:string|null;city:string|null;href:string;reminder:boolean;occurredAt:string;read:boolean};
export function countryTone(country:string|null){if(!country)return 'global';const known:Record<string,string>={bangladesh:'mint',india:'peach',nepal:'lavender',pakistan:'sky'};return known[country.toLowerCase()]||['mint','peach','lavender','sky'][Array.from(country.toLowerCase()).reduce((sum,char)=>sum+char.charCodeAt(0),0)%4];}


// Source-reviewed transactional notification catalog. Changes require coverage review.
export const ADMIN_EVENT_CATALOG=[
  {
    "table": "User",
    "type": "account",
    "family": "registration",
    "label": "Account registration or donor status",
    "fields": [
      "is_active_donor",
      "verification_status",
      "blood_group",
      "location_city",
      "location_country"
    ],
    "path": "/users"
  },
  {
    "table": "Report",
    "type": "report",
    "family": "report",
    "label": "User report submitted or reviewed",
    "fields": [
      "status"
    ],
    "path": "/reports"
  },
  {
    "table": "VerificationDocument",
    "type": "verification",
    "family": "review",
    "label": "Verification submitted or reviewed",
    "fields": [
      "review_status"
    ],
    "path": "/medical-operations"
  },
  {
    "table": "OrganRequest",
    "type": "organ-request",
    "family": "review",
    "label": "Organ request submitted or reviewed",
    "fields": [
      "status"
    ],
    "path": "/medical-operations"
  },
  {
    "table": "MedicalAidRequest",
    "type": "aid-request",
    "family": "review",
    "label": "Patient aid request submitted or reviewed",
    "fields": [
      "status"
    ],
    "path": "/financial-requests"
  },
  {
    "table": "Blog",
    "type": "blog",
    "family": "publishing",
    "label": "Blog submitted, published or reviewed",
    "fields": [
      "status",
      "title",
      "content",
      "public_image"
    ],
    "path": "/write-blog"
  },
  {
    "table": "PublicDonorProfile",
    "type": "public-profile",
    "family": "publishing",
    "label": "Public donor profile changed",
    "fields": [
      "is_published",
      "phone_visible",
      "bio",
      "article_template"
    ],
    "path": "/users"
  },
  {
    "table": "Prescription",
    "type": "prescription",
    "family": "medical",
    "label": "Prescription receipt or delivery outcome",
    "fields": [
      "email_status"
    ],
    "path": "/medical-operations"
  },
  {
    "table": "MedicalReport",
    "type": "medical-record",
    "family": "medical",
    "label": "Private record added",
    "fields": [
      "record_kind"
    ],
    "path": "/medical-operations"
  },
  {
    "table": "AuthRiskEvent",
    "type": "security",
    "family": "security",
    "label": "Identity security update",
    "fields": [
      "event_type"
    ],
    "path": "/spam-monitor"
  },
  {
    "table": "RestrictedIdentity",
    "type": "restriction",
    "family": "security",
    "label": "Identity restriction changed",
    "fields": [
      "reason",
      "is_active"
    ],
    "path": "/spam-monitor"
  },
  {
    "table": "HomepageContent",
    "type": "homepage",
    "family": "publishing",
    "label": "Homepage publication changed",
    "fields": [
      "live"
    ],
    "path": ""
  },
  {
    "table": "PublicPageContent",
    "type": "public-content",
    "family": "publishing",
    "label": "Public content publication changed",
    "fields": [
      "live"
    ],
    "path": ""
  },
  {
    "table": "ServiceAvailability",
    "type": "service-availability",
    "family": "publishing",
    "label": "Regional service availability changed",
    "fields": [
      "live"
    ],
    "path": ""
  },
  {
    "table": "RegionalPageContent",
    "type": "regional-content",
    "family": "publishing",
    "label": "Regional content publication changed",
    "fields": [
      "published",
      "title",
      "summary",
      "slides",
      "design"
    ],
    "path": ""
  },
  {
    "table": "HomepageSlider",
    "type": "slider",
    "family": "publishing",
    "label": "Homepage slider publication changed",
    "fields": [
      "status",
      "title",
      "description",
      "image_url",
      "public_image",
      "order"
    ],
    "path": "/slider-manager"
  },
  {
    "table": "PlatformSettings",
    "type": "settings",
    "family": "publishing",
    "label": "Platform configuration changed",
    "fields": [
      "discovery_visible",
      "patient_id_visible",
      "city_donation_request_visible",
      "ui_theme",
      "ads_runtime_enabled",
      "ad_units_json"
    ],
    "path": ""
  },
  {
    "table": "FaqItem",
    "type": "faq",
    "family": "publishing",
    "label": "FAQ changed",
    "fields": [
      "question",
      "answer",
      "is_active",
      "sort_order"
    ],
    "path": "/faq"
  },
  {
    "table": "Policy",
    "type": "policy",
    "family": "publishing",
    "label": "Policy content changed",
    "fields": [
      "content"
    ],
    "path": "/policy"
  },
  {
    "table": "ManualBloodDonor",
    "type": "manual-blood",
    "family": "review",
    "label": "Manual blood entries added or changed",
    "fields": [
      "is_active_donor",
      "verification_status"
    ],
    "path": "/manual-blood-donor"
  },
  {
    "table": "CommunityDonor",
    "type": "community",
    "family": "review",
    "label": "Community entries added or changed",
    "fields": [
      "is_active"
    ],
    "path": "/manual-blood-donor"
  },
  {
    "table": "ManualOrganDonor",
    "type": "manual-organ",
    "family": "review",
    "label": "Manual organ entries added or changed",
    "fields": [
      "organ_type"
    ],
    "path": "/manual-organ-donor"
  },
  {
    "table": "OrganPledge",
    "type": "organ-pledge",
    "family": "registration",
    "label": "Organ donor availability changed",
    "fields": [
      "is_active",
      "organ_type"
    ],
    "path": "/users"
  }
] as const;
