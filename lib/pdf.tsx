import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'
import type { Quote, Profile, Client } from '@/types'
import { LINE_ITEM_CATEGORY_LABELS } from '@/types'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

function formatCurrencyPDF(amount: number): string {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function formatDatePDF(dateString: string): string {
  const date = new Date(dateString)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function addDays(dateString: string, days: number): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return formatDatePDF(date.toISOString())
}

const createStyles = (brandColor: string) =>
  StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 9,
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 40,
    },
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 28,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: brandColor,
    },
    logo: {
      width: 100,
      height: 50,
      objectFit: 'contain',
    },
    businessName: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: brandColor,
    },
    businessDetails: {
      fontSize: 8.5,
      color: '#555555',
      lineHeight: 1.5,
      textAlign: 'right',
    },
    // Quote info
    quoteInfoSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    quoteTitle: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 4,
    },
    quoteNumber: {
      fontSize: 11,
      color: '#666666',
      marginBottom: 12,
    },
    labelText: {
      fontSize: 7.5,
      color: '#999999',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    valueText: {
      fontSize: 9,
      color: '#1a1a1a',
      marginBottom: 8,
    },
    // Client section
    clientSection: {
      backgroundColor: '#f8f8f8',
      padding: 12,
      borderRadius: 4,
      marginBottom: 24,
    },
    clientTitle: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#999999',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    clientName: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 2,
    },
    clientDetail: {
      fontSize: 8.5,
      color: '#555555',
      lineHeight: 1.4,
    },
    // Line items table
    table: {
      marginBottom: 16,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: brandColor,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 2,
    },
    tableHeaderText: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e5e5',
    },
    tableRowEven: {
      backgroundColor: '#f9f9f9',
    },
    tableCell: {
      fontSize: 8.5,
      color: '#1a1a1a',
    },
    tableCellMuted: {
      fontSize: 8,
      color: '#777777',
    },
    // Column widths
    colCategory: { width: '12%' },
    colDescription: { width: '40%' },
    colQty: { width: '8%', textAlign: 'right' },
    colUnit: { width: '8%', textAlign: 'center' },
    colUnitPrice: { width: '14%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },
    // Totals
    totalsSection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 24,
    },
    totalsBox: {
      width: '40%',
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: '#e5e5e5',
    },
    totalLabel: {
      fontSize: 8.5,
      color: '#555555',
    },
    totalValue: {
      fontSize: 8.5,
      color: '#1a1a1a',
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      backgroundColor: brandColor,
      paddingHorizontal: 8,
      borderRadius: 2,
      marginTop: 4,
    },
    grandTotalLabel: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
    },
    grandTotalValue: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
    },
    // Sections
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: brandColor,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e5e5',
    },
    sectionText: {
      fontSize: 8.5,
      color: '#444444',
      lineHeight: 1.6,
    },
    // Signature
    signatureSection: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#e5e5e5',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    signatureBox: {
      width: '45%',
    },
    signatureLine: {
      borderBottomWidth: 1,
      borderBottomColor: '#aaaaaa',
      marginBottom: 4,
      paddingBottom: 20,
    },
    signatureLabel: {
      fontSize: 7.5,
      color: '#999999',
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: '#e5e5e5',
    },
    footerText: {
      fontSize: 7.5,
      color: '#aaaaaa',
    },
    pageNumber: {
      fontSize: 7.5,
      color: '#aaaaaa',
    },
  })

interface QuotePDFProps {
  quote: Quote
  profile: Profile
  client: Client | null
}

export function QuotePDF({ quote, profile, client }: QuotePDFProps) {
  const brandColor = profile.brand_color || '#C9982A'
  const styles = createStyles(brandColor)

  const validUntil = addDays(quote.created_at, quote.validity_days)
  const quoteDate = formatDatePDF(quote.created_at)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {profile.logo_url ? (
              <Image src={profile.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.businessName}>{profile.business_name || 'QuoteSnap'}</Text>
            )}
          </View>
          <View>
            <Text style={styles.businessDetails}>
              {profile.business_name ? `${profile.business_name}\n` : ''}
              {profile.address ? `${profile.address}\n` : ''}
              {profile.city && profile.state ? `${profile.city} ${profile.state} ${profile.postcode || ''}\n` : ''}
              {profile.phone ? `Ph: ${profile.phone}\n` : ''}
              {profile.email ? `${profile.email}\n` : ''}
              {profile.abn ? `ABN: ${profile.abn}` : ''}
            </Text>
          </View>
        </View>

        {/* Quote info and client */}
        <View style={styles.quoteInfoSection}>
          <View>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteNumber}>{quote.quote_number}</Text>

            <Text style={styles.labelText}>Date Issued</Text>
            <Text style={styles.valueText}>{quoteDate}</Text>

            <Text style={styles.labelText}>Valid Until</Text>
            <Text style={styles.valueText}>{validUntil}</Text>

            {quote.timeline && (
              <>
                <Text style={styles.labelText}>Estimated Duration</Text>
                <Text style={styles.valueText}>{quote.timeline}</Text>
              </>
            )}
          </View>

          {client && (
            <View style={styles.clientSection}>
              <Text style={styles.clientTitle}>Quote Prepared For</Text>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.address && (
                <Text style={styles.clientDetail}>{client.address}</Text>
              )}
              {(client.city || client.state) && (
                <Text style={styles.clientDetail}>
                  {[client.city, client.state, client.postcode].filter(Boolean).join(' ')}
                </Text>
              )}
              {client.phone && (
                <Text style={styles.clientDetail}>Ph: {client.phone}</Text>
              )}
              {client.email && (
                <Text style={styles.clientDetail}>{client.email}</Text>
              )}
            </View>
          )}
        </View>

        {/* Site notes */}
        {quote.site_notes && (
          <View style={[styles.section, { backgroundColor: '#f8f8f8', padding: 10, borderRadius: 4 }]}>
            <Text style={styles.sectionTitle}>Project Overview</Text>
            <Text style={styles.sectionText}>{quote.site_notes}</Text>
          </View>
        )}

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colCategory]}>Category</Text>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {quote.line_items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
            >
              <Text style={[styles.tableCell, styles.tableCellMuted, styles.colCategory]}>
                {LINE_ITEM_CATEGORY_LABELS[item.category] || item.category}
              </Text>
              <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.tableCell, styles.colUnitPrice]}>
                {formatCurrencyPDF(item.unit_price)}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrencyPDF(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrencyPDF(quote.subtotal)}</Text>
            </View>
            {quote.gst_included && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>GST (10%)</Text>
                <Text style={styles.totalValue}>{formatCurrencyPDF(quote.gst_amount)}</Text>
              </View>
            )}
            {!quote.gst_included && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalLabel, { color: '#999999', fontSize: 7.5 }]}>
                  * Prices exclude GST
                </Text>
                <Text style={styles.totalValue}></Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>
                TOTAL {quote.gst_included ? '(Inc. GST)' : '(Ex. GST)'}
              </Text>
              <Text style={styles.grandTotalValue}>{formatCurrencyPDF(quote.total)}</Text>
            </View>
          </View>
        </View>

        {/* Scope of work */}
        {quote.scope_of_work && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope of Works</Text>
            <Text style={styles.sectionText}>{quote.scope_of_work}</Text>
          </View>
        )}

        {/* Exclusions */}
        {quote.exclusions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exclusions</Text>
            <Text style={styles.sectionText}>{quote.exclusions}</Text>
          </View>
        )}

        {/* Assumptions */}
        {quote.assumptions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assumptions</Text>
            <Text style={styles.sectionText}>{quote.assumptions}</Text>
          </View>
        )}

        {/* Payment terms */}
        {quote.payment_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.sectionText}>{quote.payment_terms}</Text>
            {profile.bank_details && (
              <Text style={[styles.sectionText, { marginTop: 4 }]}>{profile.bank_details}</Text>
            )}
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Client Signature</Text>
            <Text style={styles.signatureLabel}>Date: _______________</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              Authorised by {profile.business_name || ''}
            </Text>
            <Text style={styles.signatureLabel}>Date: _______________</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {profile.business_name}
            {profile.abn ? ` | ABN ${profile.abn}` : ''}
            {profile.license_number ? ` | Lic. ${profile.license_number}` : ''}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
