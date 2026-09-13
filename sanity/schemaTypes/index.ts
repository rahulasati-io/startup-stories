import { authorType } from "./authorType";
import { blockContentType } from "./blockContentType";
import { categoryType } from "./categoryType";
import { companyType } from "./companyType";
import { companyBusinessModelComponentType } from "./companyBusinessModelComponentType";
import { companyMetricType } from "./companyMetricType";
import { companyPersonRoleType } from "./companyPersonRoleType";
import { companyStrategyType } from "./companyStrategyType";
import { conceptType } from "./conceptType";
import { founderType } from "./founderType";
import { fundingRoundType } from "./fundingRoundType";
import { industryType } from "./industryType";
import { postType } from "./postType";
import { seoSettingsType } from "./seoSettingsType";
import { timelineEventType } from "./timelineEventType";

export const schemaTypes = [
  authorType,
  blockContentType,
  categoryType,
  companyType,
  companyBusinessModelComponentType,
  companyMetricType,
  companyPersonRoleType,
  companyStrategyType,
  conceptType,
  founderType,
  fundingRoundType,
  industryType,
  postType,
  seoSettingsType,
  timelineEventType,
];

export const schema = {
  types: schemaTypes,
};
