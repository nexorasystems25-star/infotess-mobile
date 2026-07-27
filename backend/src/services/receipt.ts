export interface ReceiptData {
  receipt_number: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  academic_year: string;
  semester: string;
  full_name: string;
  index_number: string;
  department: string;
  level: string;
  phone_number?: string;
  verification_hash?: string;
}

const LOGO_BASE64 = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAKACAIAAACDr150AAABOWlDQ1BJQ0MgUHJvZmlsZQAAJVjYGC8k1hQkMNiwMCQm1dSFOTupBARGaXA/oqBmUGAgYOBm0E/Mbm4wDEgwIcBCGA0Kvh2jYERRF/WBZm13/PxfLWfESsPTRNl+XE/3AhTPQrgTEktTgbSH4BYJbmgqISBgVEEyA4oLykAsVOAbJEioKOA7AoQOx3C7gGxkyDsBWA1IUHOQPYWIFsjCYmdjsTOzSlNhtoLcjFPal5oMJDmAGIZhmKGIAZ3BiccakzAapwZ8hkKGCoZihgyGdIZMhhKGBQYHIEiBQw5DKlAtidDHkMygx6DDpBtxGAAxGag8EQPJ4RY/iIGBouvDAzMExBiSTMZGLa3MjBI3EKIqQD9yN/CwLDtfEFiUSJYiAWImdLSGBg+LWdg4I1kYBC+wMDAFQ0LWADD81NZ+QZ1BwAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAACgKADAAQAAAABAAACgAAAAAAjWuzFAAAAHGlET1QAAAACAAAAAAAAAUAAAAAoAAABQAAAAUAABG2lWgBthAAAQABJREFUeAHsfQeYU2X6/U1PpgLSmZbeJ9N7TaY3hqGjoCBFiugiKCIKFkCxIoqKvRcEAUWwgghIU+lIr9Nrek/+58sdZlmV/a0+u/t3NfOcJ9wJSSb57s09933f856X8gV/givwB14Br993FTxefzd8fm8Abp//H+D2O6+Cy+0HyD1e39/h8TpcbpvTYXPYrUZbl8lutDjNDq/d43cDeIrT58BjHE6L2dLZ2dUKYMNhN7tdtsBDPORd4LEun9fh8djdbpvLacFL4kk+v8vv9/j93gA8fofV77T58TzyVPvf4bP6Aa/F7zH7PSa/2+j3Gv2eLr+/xe9t8rvq/dbzfuNpd9txW/MRc+MhY+sxK4DtpsOmhoNdl3/suPRDO1B/pJFGw9GmpuMtrSfb2093dp414rbjTBc2us6ZTBcslks2W73D3uB0tfoBTwuBr70b/g5/N/AGjAGY/H7A7Pfa/H6H3+/0d3+uKx/N63SRFfC6/D534BF4EB5qwzLa3Far3WKxmW0Oq9PtcHtd2Gv48fv92GUuj9NutzudTtyD487tNns8Fqyj34e/gZfC3iR71uMjcGE5r8Dp8wM+zy/h9WF30IcDfXvVg/7Ah3bwrf21VgDHf88PPrk38EP9tdYg+Gn/11bgKvYFE/9+AgY9ukGVAYAnwcc+rxsA1wKgDbvHBoA8CH+4LFe4lFBCgBVcYF+7zWQ3W/CvD7Tuu8KyV7gWDwSJeOxep8VtMzosnTZTu8Vq8lqMHlOHp6PF0dpobbxkvHy+8+LZ9pMHL//048Wj+y8c+O70/u0nv/vq6M7PDu7YcmDDS198tPqzNas2vf3UR68uf3/1kreeXfzqyvtefnD24w/c+tjimcsXTlt69+QH75y4+I4J984Zv3DG2FnArOtnzx5/+5yJc++cMn/B9IULZ953/+0PPnTH0kfmP/rUoqefX7b6tSffeHfV+x+88OFX677dun7nrk/27vvsx0PfHPnpu5On950598P5c/vPXfzxYv2RhtaTbaZzZke909Ps97f52xtspla300SY2Gv3uyx+XGo4zE6yAmRvYMPusnfZzG3mrkZTZwOuYFx+J3jX4bLTwDZgtVoJ4/q94GP8uAM/ARq2gIA9uHi5soPA0MC1CLj7yoZe8+5bQtng4L8jsGfp/fu/drwH3++fdgV62Bcb+JBBAv7T7uk/1wdDnPSPCARFgYgMwSYNhF/dcPvtAVwdB5Ntp8vaA9Aw4VcvCNPjcJsInEabvdNmx63R4TS7PTavB4zrcNmsgNvu8DiciPlw67cH/hT9Z21+n9HvaPVYm5yudr+t2d11Vnhl+GQ8p2aL/0D88JL1YVfT+Pf00N9+8Rf8B4wBmPx+wOz32vx+h9/v9Hd/rusP83rdJEV8Lr/P7b8XHoaH2rCMNrdNa7dYbGabw+p0O9xOF/Yafvx+/3Y5y+N02+12p9Ppcnrcbuw1fPi9fo8XG9bvcTjtTqfT5XK7vW4cNnz4/X6fx4oN7/e73A632+1xu71eNw4bPvz+AIfDhQ0f8Hs9bo/H4/V4fT4cNnz4A4EcLg82fDDg83q8Xq/P5w8EcdjwEQiGcHl82PChUCDo9fl9/kAoHMZhw0cwFM7h9mHDh6OhaCQUiUZj8UQShw0fqWQql8fY8JlMOh2LxmKJZCqdyWKwmXwhm0rn8gW8eD5XKBQLpXIZL14sVarVGr54rd5otT3xeiPa6Xrj8Wan2+uLd3v9QX8wHI0n09l8sVytNZrtTq8/GE1m88VytV6vN5rtbr8/HI3ni+V6s93tD0bj+XK12W53+8FoPJ0v1pvt7nA8Xaw2u/3heLpYbXb7w/FsuV7vdofj2XK93R9O5qvN/nA8X233h+PlZn84Xm33h+P17nA4Xu8Oh+Pt4XA43u0Ph+P94XA4PhwOh+Pj4XA4Ph0Oh+Pz4XA4vhgOh+PL4XA4vhoOh+Pb4XA4vh8Oh+OH4XD4cTgcfhoOh5+Hw+Hk4XD4ZTgcfh0Oh9PHw+H0x+Fw+Otwwv8Bb1976CfDfRIAAAAASUVORK5CYII=`;

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generateReceiptHTML(data: ReceiptData, totalPaid: number, required: number): string {
  const status = totalPaid >= required ? 'PAID' : 'PARTIAL';
  const balance = Math.max(0, required - totalPaid);
  const verifyUrl = `http%3A%2F%2Flocalhost%3A3002%2Fapi%2Fv1%2Fverify%3Fq%3D${encodeURIComponent(data.receipt_number)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${verifyUrl}`;

  let balanceRow = '';
  if (balance > 0) {
    balanceRow = `
                        <tr>
                            <th colspan='3' class='text-end' style='color: red;'>Remaining Balance:</th>
                            <th class='text-end' style='color: red;'>GHS ${Number(balance).toFixed(2)}</th>
                        </tr>`;
  }

  return `
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Payment Receipt</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f8f9fa;
                    padding: 40px;
                    color: #333;
                }
                .receipt-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border: 1px solid #ddd;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .receipt-header {
                    text-align: center;
                    border-bottom: 3px solid #4F46E5;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .receipt-header h1 {
                    color: #800020;
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }
                .receipt-header p {
                    margin: 2px 0;
                    font-size: 14px;
                    color: #555;
                }
                .receipt-header h3 {
                    margin-top: 15px;
                    font-size: 18px;
                    font-weight: bold;
                    text-transform: uppercase;
                    color: #333;
                }
                .logo {
                    width: 80px;
                    height: auto;
                    margin-bottom: 10px;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .col {
                    width: 48%;
                }
                .details-title {
                    font-weight: bold;
                    font-size: 16px;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                .details-item {
                    margin-bottom: 5px;
                    font-size: 14px;
                }
                .details-item strong {
                    display: inline-block;
                    width: 120px;
                    color: #555;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .text-end {
                    text-align: right;
                }
                .footer-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 40px;
                }
                .qr-section {
                    text-align: center;
                }
                .qr-code {
                    width: 100px;
                    height: 100px;
                    margin-bottom: 10px;
                }
                .signature-section {
                    text-align: center;
                    width: 200px;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    margin-bottom: 5px;
                }
                .info-box {
                    background-color: #e0f7fa;
                    color: #006064;
                    padding: 15px;
                    border-radius: 4px;
                    font-size: 13px;
                    margin-top: 30px;
                    border: 1px solid #b2ebf2;
                }
                .status-badge {
                    position: absolute;
                    top: 160px;
                    right: 60px;
                    border: 2px solid #28a745;
                    color: #28a745;
                    padding: 5px 15px;
                    font-weight: bold;
                    font-size: 18px;
                    transform: rotate(-15deg);
                    opacity: 0.8;
                }
                .action-buttons { max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end; gap: 10px; }
                .btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 5px; }
                .btn-print { background-color: #4F46E5; color: white; }
                .btn-download { background-color: #10B981; color: white; }
                @media print { .no-print { display: none !important; } body { background-color: white; padding: 0; } .receipt-container { box-shadow: none; border: none; padding: 0; max-width: 100%; } }
            </style>
        </head>
                <body>
            <div class='action-buttons no-print'>
                <button onclick='window.print()' class='btn btn-print'> Print Receipt</button>
                <button onclick='downloadPDF()' class='btn btn-download'> Download PDF</button>
            </div>
            <div class='receipt-container' id='receipt-content' style='position:relative;'>
                <div class='receipt-header'>
                    <img src='${LOGO_BASE64}' class='logo' />
                    <h1>INFOTESS IT DEPARTMENT</h1>
                    <p>Infotess.edu.gh, Kumasi, Ghana</p>
                    <p>Tel: +233 24 091 8031 | Email: info@infotess.edu</p>
                    <h3>OFFICIAL PAYMENT RECEIPT</h3>
                </div>

                <div class='status-badge'>${escHtml(status)}</div>

                <div class='row'>
                    <div class='col'>
                        <div class='details-title'>Receipt Details</div>
                        <div class='details-item'><strong>Receipt No:</strong> ${escHtml(data.receipt_number)}</div>
                        <div class='details-item'><strong>Date:</strong> ${escHtml(data.payment_date)}</div>
                        <div class='details-item'><strong>Payment Method:</strong> ${escHtml(data.payment_method)}</div>
                    </div>
                    <div class='col text-end' style='text-align: right;'>
                        <div class='details-title' style='text-align: right;'>Student Details</div>
                        <div class='details-item'><strong>Name:</strong> ${escHtml(data.full_name)}</div>
                        <div class='details-item'><strong>Index No:</strong> ${escHtml(data.index_number)}</div>
                        <div class='details-item'><strong>Department:</strong> ${escHtml(data.department)}</div>
                        <div class='details-item'><strong>Level:</strong> ${escHtml(String(data.level))}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Academic Year</th>
                            <th>Semester</th>
                            <th class='text-end'>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Infotess Dues Payment</td>
                            <td>${escHtml(data.academic_year)}</td>
                            <td>${escHtml(data.semester)}</td>
                            <td class='text-end'>GHS ${Number(data.amount).toFixed(2)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan='3' class='text-end'>Total Amount Paid:</th>
                            <th class='text-end'>GHS ${Number(totalPaid).toFixed(2)}</th>
                        </tr>
                        ${balanceRow}
                    </tfoot>
                </table>

                <div class='footer-row'>
                    <div class='qr-section'>
                        <img src='${qrUrl}' class='qr-code' />
                        <p style='font-size: 12px; margin: 0;'>Scan to verify: ${escHtml(data.receipt_number)}</p>
                    </div>
                    <div class='signature-section'>
                        <div class='signature-line'></div>
                        <div style='font-weight: bold;'>Authorized Signature</div>
                        <div style='font-size: 12px; color: #666;'>Finance Office</div>
                    </div>
                </div>

                <div class='info-box'>
                    <strong>Information:</strong> This is an official digital receipt. Keep this for your records. You can access this receipt anytime from the payment records.
                </div>
            </div>
                    <script src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'></script>
            <script>
                function downloadPDF() {
                    const element = document.getElementById('receipt-content');
                    const opt = {
                        margin: 10,
                        filename: 'Receipt_${escHtml(data.receipt_number)}.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save();
                }
            </script>
        </body>
        </html>
        `;
}
