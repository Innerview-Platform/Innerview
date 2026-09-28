package com.innerview.spring.dto;

import java.util.List;

/**
 * Shared HTML shell for every outbound notification email, so each {@link Notification} subclass
 * only has to supply its own copy (badge, heading, intro, detail rows, call-to-action) instead of
 * hand-rolling markup per notification kind.
 */
final class NotificationEmailTemplate {

  private NotificationEmailTemplate() {}

  record DetailRow(String label, String value) {}

  static String render(
      String badgeLabel,
      String heading,
      String introHtml,
      List<DetailRow> details,
      String ctaLabel,
      String ctaUrl,
      String footerHtml) {

    StringBuilder detailsBlock = new StringBuilder();
    if (details != null && !details.isEmpty()) {
      StringBuilder rows = new StringBuilder();
      for (DetailRow row : details) {
        rows.append("<tr><td style=\"padding: 20px 24px; border-bottom:1px solid rgba(139,92,246,0.1);\">")
            .append("<p style=\"margin:0 0 6px 0; font-size:10px; letter-spacing:2px; color:#7c6f9d; text-transform:uppercase; font-weight:600;\">")
            .append(escapeHtml(row.label()))
            .append("</p><p style=\"margin:0; font-size:15px; line-height:22px; color:#ffffff; font-weight:600;\">")
            .append(escapeHtml(row.value()))
            .append("</p></td></tr>");
      }
      detailsBlock
          .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"padding: 0 48px;\"><tr>")
          .append("<td style=\"background:rgba(10,6,19,0.6); border:1px solid rgba(139,92,246,0.15); border-radius:14px;\">")
          .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">")
          .append(rows)
          .append("</table></td></tr></table>");
    }

    StringBuilder ctaBlock = new StringBuilder();
    if (ctaLabel != null && ctaUrl != null) {
      ctaBlock
          .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>")
          .append("<td align=\"center\" style=\"padding: 36px 48px 40px 48px;\">")
          .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>")
          .append("<td style=\"border-radius:10px; background:linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); box-shadow: 0 8px 24px rgba(139,92,246,0.35);\">")
          .append("<a href=\"")
          .append(ctaUrl)
          .append("\" style=\"display:inline-block; padding:14px 32px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;\">")
          .append(escapeHtml(ctaLabel))
          .append("</a></td></tr></table></td></tr></table>");
    }

    return SHELL
        .replace("{{title}}", escapeHtml(heading))
        .replace("{{badge}}", escapeHtml(badgeLabel))
        .replace("{{heading}}", escapeHtml(heading))
        .replace("{{intro}}", introHtml == null ? "" : introHtml)
        .replace("{{details}}", detailsBlock.toString())
        .replace("{{cta}}", ctaBlock.toString())
        .replace("{{footer}}", footerHtml == null ? "" : footerHtml);
  }

  static String escapeHtml(String s) {
    if (s == null) return "";
    return s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }

  private static final String SHELL =
      """
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="dark">
      <meta name="supported-color-schemes" content="dark">
      <title>{{title}} — InnerView</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
        body { margin: 0; padding: 0; background-color: #0a0613; }
        .hover-purple:hover { background-color: #7c3aed !important; }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .px-mobile { padding-left: 24px !important; padding-right: 24px !important; }
          .h1-mobile { font-size: 28px !important; line-height: 36px !important; }
        }
      </style>
      </head>
      <body style="margin:0; padding:0; background-color:#0a0613; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0613; background-image: radial-gradient(ellipse at top, rgba(139,92,246,0.15) 0%, transparent 60%);">
        <tr>
          <td align="center" style="padding: 48px 16px;">
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
              <tr>
                <td class="px-mobile" style="padding: 0 8px 32px 8px;">
                  <span style="display:inline-block; padding:8px 14px; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.3); border-radius:999px; font-size:11px; font-weight:600; letter-spacing:2px; color:#c4b5fd; text-transform:uppercase;">InnerView</span>
                </td>
              </tr>
              <tr>
                <td style="background:#13091f; background-image: linear-gradient(180deg, #1a0f2e 0%, #100820 100%); border:1px solid rgba(139,92,246,0.18); border-radius:20px; overflow:hidden;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="height:3px; background:linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%); font-size:0; line-height:0;">&nbsp;</td></tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td class="px-mobile" style="padding: 40px 48px 8px 48px;">
                      <span style="display:inline-block; padding:6px 12px; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.35); border-radius:999px; font-size:11px; font-weight:600; letter-spacing:1.5px; color:#86efac; text-transform:uppercase;">{{badge}}</span>
                    </td></tr>
                    <tr><td class="px-mobile h1-mobile" style="padding: 16px 48px 0 48px;">
                      <h1 style="margin:0; font-size:32px; line-height:40px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">{{heading}}</h1>
                    </td></tr>
                    <tr><td class="px-mobile" style="padding: 16px 48px 32px 48px;">
                      <p style="margin:0; font-size:15px; line-height:24px; color:#a8a3b8;">{{intro}}</p>
                    </td></tr>
                  </table>
                  {{details}}
                  {{cta}}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td class="px-mobile" style="padding: 24px 48px; background:rgba(10,6,19,0.4); border-top:1px solid rgba(139,92,246,0.1);">
                      <p style="margin:0; font-size:12px; line-height:18px; color:#7c6f9d; font-family:'JetBrains Mono', monospace;">{{footer}}</p>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="px-mobile" style="padding: 32px 8px 0 8px;" align="center">
                  <p style="margin:0; font-size:11px; color:#3d3651;">InnerView · A sharper room for serious mock interviews</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      </body>
      </html>
      """;
}
