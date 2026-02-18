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

export const PrivacyPolicyScreen = () => {
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
        <Text style={styles.headerTitle}>{t('privacy.headerTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <Text style={styles.mainTitle}>{t('privacy.mainTitle')}</Text>
        <Text style={styles.subtitle}>{t('privacy.subtitle')}</Text>
        <Text style={styles.meta}>{t('privacy.version')}</Text>
        <Text style={styles.meta}>{t('privacy.effectiveDate')}</Text>

        {/* Introduction */}
        <Text style={styles.sectionTitle}>{t('privacy.introductionTitle')}</Text>
        <Text style={styles.body}>{t('privacy.intro1')}</Text>
        <Text style={styles.body}>{t('privacy.intro2')}</Text>
        <Text style={styles.body}>{t('privacy.intro3')}</Text>

        {/* Data We Collect */}
        <Text style={styles.sectionTitle}>{t('privacy.dataCollectTitle')}</Text>
        <Text style={styles.body}>{t('privacy.dataCollect1')}</Text>
        <Text style={styles.body}>{t('privacy.dataCollect2')}</Text>
        <Text style={styles.body}>{t('privacy.dataCollect3')}</Text>
        <Text style={styles.body}>{t('privacy.dataCollect4')}</Text>

        {/* How We Use Your Data */}
        <Text style={styles.sectionTitle}>{t('privacy.dataUseTitle')}</Text>
        <Text style={styles.body}>{t('privacy.dataUse1')}</Text>
        <Text style={styles.body}>{t('privacy.dataUse2')}</Text>

        {/* Legal Basis */}
        <Text style={styles.sectionTitle}>{t('privacy.legalBasisTitle')}</Text>
        <Text style={styles.body}>{t('privacy.legalBasis1')}</Text>

        {/* Data Sharing */}
        <Text style={styles.sectionTitle}>{t('privacy.dataSharingTitle')}</Text>
        <Text style={styles.body}>{t('privacy.dataSharing1')}</Text>
        <Text style={styles.body}>{t('privacy.dataSharing2')}</Text>

        {/* Data Storage and Security */}
        <Text style={styles.sectionTitle}>{t('privacy.dataStorageTitle')}</Text>
        <Text style={styles.body}>{t('privacy.dataStorage1')}</Text>
        <Text style={styles.body}>{t('privacy.dataStorage2')}</Text>
        <Text style={styles.body}>{t('privacy.dataStorage3')}</Text>

        {/* Data Retention */}
        <Text style={styles.sectionTitle}>{t('privacy.dataRetentionTitle')}</Text>
        <Text style={styles.body}>{t('privacy.dataRetention1')}</Text>
        <Text style={styles.body}>{t('privacy.dataRetention2')}</Text>

        {/* Your Rights */}
        <Text style={styles.sectionTitle}>{t('privacy.yourRightsTitle')}</Text>
        <Text style={styles.body}>{t('privacy.yourRights1')}</Text>
        <Text style={styles.body}>{t('privacy.yourRights2')}</Text>

        {/* Cookies and Analytics */}
        <Text style={styles.sectionTitle}>{t('privacy.cookiesTitle')}</Text>
        <Text style={styles.body}>{t('privacy.cookies1')}</Text>
        <Text style={styles.body}>{t('privacy.cookies2')}</Text>

        {/* Children's Privacy */}
        <Text style={styles.sectionTitle}>{t('privacy.childrenTitle')}</Text>
        <Text style={styles.body}>{t('privacy.children1')}</Text>

        {/* International Data Transfers */}
        <Text style={styles.sectionTitle}>{t('privacy.transfersTitle')}</Text>
        <Text style={styles.body}>{t('privacy.transfers1')}</Text>

        {/* Changes to This Policy */}
        <Text style={styles.sectionTitle}>{t('privacy.changesToPolicyTitle')}</Text>
        <Text style={styles.body}>{t('privacy.changesToPolicy1')}</Text>
        <Text style={styles.body}>{t('privacy.changesToPolicy2')}</Text>

        {/* Contact */}
        <Text style={styles.sectionTitle}>{t('privacy.contactTitle')}</Text>
        <Text style={styles.body}>{t('privacy.contact1')}</Text>
        <Text style={styles.body}>{t('privacy.contact2')}</Text>
        <Text style={styles.body}>{t('privacy.contact3')}</Text>
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
