import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { colors, fontFamily } from '../../../shared/constants';

// Back arrow icon — 24x24
const backArrowSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18L9 12L15 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const TermsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.neutral[900]} translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SvgXml xml={backArrowSvg} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('terms.headerTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <Text style={styles.mainTitle}>{t('terms.mainTitle')}</Text>
        <Text style={styles.subtitle}>{t('terms.subtitle')}</Text>
        <Text style={styles.meta}>{t('terms.version')}</Text>
        <Text style={styles.meta}>{t('terms.effectiveDate')}</Text>
        <Text style={styles.meta}>{t('terms.previousVersions')}</Text>

        {/* Introduction */}
        <Text style={styles.sectionTitle}>{t('terms.introductionTitle')}</Text>
        <Text style={styles.body}>{t('terms.intro1')}</Text>
        <Text style={styles.body}>{t('terms.intro2')}</Text>
        <Text style={styles.body}>{t('terms.intro3')}</Text>
        <Text style={styles.body}>{t('terms.intro4')}</Text>

        {/* Definitions */}
        <Text style={styles.sectionTitle}>{t('terms.definitionsTitle')}</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>{t('terms.defAccount')}</Text>
          {t('terms.defAccountDesc')}
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>{t('terms.defUserContent')}</Text>
          {t('terms.defUserContentDesc')}
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>{t('terms.defIntegrations')}</Text>
          {t('terms.defIntegrationsDesc')}
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>{t('terms.defSubscription')}</Text>
          {t('terms.defSubscriptionDesc')}
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>{t('terms.defAppStores')}</Text>
          {t('terms.defAppStoresDesc')}
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>{t('terms.defPrivacyPolicy')}</Text>
          {t('terms.defPrivacyPolicyDesc')}
        </Text>

        {/* Provision of services */}
        <Text style={styles.sectionTitle}>{t('terms.servicesTitle')}</Text>
        <Text style={styles.body}>{t('terms.services1')}</Text>
        <Text style={styles.body}>{t('terms.services2')}</Text>

        {/* Registration and accounts */}
        <Text style={styles.sectionTitle}>{t('terms.registrationTitle')}</Text>
        <Text style={styles.body}>{t('terms.registration1')}</Text>
        <Text style={styles.body}>{t('terms.registration2')}</Text>
        <Text style={styles.body}>{t('terms.registration3')}</Text>
        <Text style={styles.body}>{t('terms.registration4')}</Text>
        <Text style={styles.body}>{t('terms.registration5')}</Text>
        <Text style={styles.body}>{t('terms.registration6')}</Text>

        {/* User rights and responsibilities */}
        <Text style={styles.sectionTitle}>{t('terms.userRightsTitle')}</Text>
        <Text style={styles.body}>{t('terms.userRights1')}</Text>
        <Text style={styles.body}>{t('terms.userRights2')}</Text>
        <Text style={styles.body}>{t('terms.userRights3')}</Text>

        {/* Rights and obligations of the operator */}
        <Text style={styles.sectionTitle}>{t('terms.operatorRightsTitle')}</Text>
        <Text style={styles.body}>{t('terms.operatorRights1')}</Text>
        <Text style={styles.body}>{t('terms.operatorRights2')}</Text>

        {/* Paid subscriptions */}
        <Text style={styles.sectionTitle}>{t('terms.subscriptionsTitle')}</Text>
        <Text style={styles.body}>{t('terms.subscriptions1')}</Text>
        <Text style={styles.body}>{t('terms.subscriptions2')}</Text>
        <Text style={styles.body}>{t('terms.subscriptions3')}</Text>
        <Text style={styles.body}>{t('terms.subscriptions4')}</Text>
        <Text style={styles.body}>{t('terms.subscriptions5')}</Text>

        {/* Returns and Cancellations */}
        <Text style={styles.sectionTitle}>{t('terms.returnsTitle')}</Text>
        <Text style={styles.body}>{t('terms.returns1')}</Text>
        <Text style={styles.body}>{t('terms.returns2')}</Text>
        <Text style={styles.body}>{t('terms.returns3')}</Text>
        <Text style={styles.body}>{t('terms.returns4')}</Text>

        {/* Intellectual Property and Licensing */}
        <Text style={styles.sectionTitle}>{t('terms.ipTitle')}</Text>
        <Text style={styles.body}>{t('terms.ip1')}</Text>
        <Text style={styles.body}>{t('terms.ip2')}</Text>
        <Text style={styles.body}>{t('terms.ip3')}</Text>

        {/* Restrictions on use */}
        <Text style={styles.sectionTitle}>{t('terms.restrictionsTitle')}</Text>
        <Text style={styles.body}>{t('terms.restrictions1')}</Text>

        {/* Privacy and personal data */}
        <Text style={styles.sectionTitle}>{t('terms.privacyDataTitle')}</Text>
        <Text style={styles.body}>{t('terms.privacyData1')}</Text>
        <Text style={styles.body}>{t('terms.privacyData2')}</Text>
        <Text style={styles.body}>{t('terms.privacyData3')}</Text>

        {/* Security and 2FA */}
        <Text style={styles.sectionTitle}>{t('terms.securityTitle')}</Text>
        <Text style={styles.body}>{t('terms.security1')}</Text>
        <Text style={styles.body}>{t('terms.security2')}</Text>
        <Text style={styles.body}>{t('terms.security3')}</Text>

        {/* Integration with banks */}
        <Text style={styles.sectionTitle}>{t('terms.integrationTitle')}</Text>
        <Text style={styles.body}>{t('terms.integration1')}</Text>
        <Text style={styles.body}>{t('terms.integration2')}</Text>
        <Text style={styles.body}>{t('terms.integration3')}</Text>
        <Text style={styles.body}>{t('terms.integration4')}</Text>

        {/* Import and export data */}
        <Text style={styles.sectionTitle}>{t('terms.importExportTitle')}</Text>
        <Text style={styles.body}>{t('terms.importExport1')}</Text>
        <Text style={styles.body}>{t('terms.importExport2')}</Text>
        <Text style={styles.body}>{t('terms.importExport3')}</Text>

        {/* Push notifications */}
        <Text style={styles.sectionTitle}>{t('terms.pushTitle')}</Text>
        <Text style={styles.body}>{t('terms.push1')}</Text>
        <Text style={styles.body}>{t('terms.push2')}</Text>

        {/* Cloud backups and restore */}
        <Text style={styles.sectionTitle}>{t('terms.backupTitle')}</Text>
        <Text style={styles.body}>{t('terms.backup1')}</Text>
        <Text style={styles.body}>{t('terms.backup2')}</Text>
        <Text style={styles.body}>{t('terms.backup3')}</Text>

        {/* Third party services */}
        <Text style={styles.sectionTitle}>{t('terms.thirdPartyTitle')}</Text>
        <Text style={styles.body}>{t('terms.thirdParty1')}</Text>
        <Text style={styles.body}>{t('terms.thirdParty2')}</Text>

        {/* Disclaimer of warranties */}
        <Text style={styles.sectionTitle}>{t('terms.disclaimerTitle')}</Text>
        <Text style={styles.body}>{t('terms.disclaimer1')}</Text>
        <Text style={styles.body}>{t('terms.disclaimer2')}</Text>
        <Text style={styles.body}>{t('terms.disclaimer3')}</Text>

        {/* Termination, blocking, account deletion */}
        <Text style={styles.sectionTitle}>{t('terms.terminationTitle')}</Text>
        <Text style={styles.body}>{t('terms.termination1')}</Text>
        <Text style={styles.body}>{t('terms.termination2')}</Text>
        <Text style={styles.body}>{t('terms.termination3')}</Text>
        <Text style={styles.body}>{t('terms.termination4')}</Text>

        {/* Notifications of changes */}
        <Text style={styles.sectionTitle}>{t('terms.changesTitle')}</Text>
        <Text style={styles.body}>{t('terms.changes1')}</Text>
        <Text style={styles.body}>{t('terms.changes2')}</Text>
        <Text style={styles.body}>{t('terms.changes3')}</Text>
        <Text style={styles.body}>{t('terms.changes4')}</Text>

        {/* Dispute resolution */}
        <Text style={styles.sectionTitle}>{t('terms.disputeTitle')}</Text>
        <Text style={styles.body}>{t('terms.dispute1')}</Text>
        <Text style={styles.body}>{t('terms.dispute2')}</Text>

        {/* Applicable law */}
        <Text style={styles.sectionTitle}>{t('terms.lawTitle')}</Text>
        <Text style={styles.body}>{t('terms.law1')}</Text>
        <Text style={styles.body}>{t('terms.law2')}</Text>

        {/* Force majeure */}
        <Text style={styles.sectionTitle}>{t('terms.forceTitle')}</Text>
        <Text style={styles.body}>{t('terms.force1')}</Text>

        {/* Contact details */}
        <Text style={styles.sectionTitle}>{t('terms.contactTitle')}</Text>
        <Text style={styles.body}>{t('terms.contact1')}</Text>
        <Text style={styles.body}>{t('terms.contact2')}</Text>
        <Text style={styles.body}>{t('terms.contact3')}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.neutral[900],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 18,
    lineHeight: 24,
    color: colors.white[100],
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  mainTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.white[100],
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white[50],
    marginBottom: 8,
  },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.white[40],
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.white[100],
    marginTop: 28,
    marginBottom: 12,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.white[70],
    marginBottom: 12,
  },
  bold: {
    fontFamily: fontFamily.semiBold,
    color: colors.white[100],
  },
});
