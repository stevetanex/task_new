// Sample database and AI responses data
const sampleData = {
  tables: {
    tbl_001: [
      {id: 1, col1: "Product A", col2: 15000, field_a: "Electronics", misc_data: "Q1-2024", dt: "2024-01-15"},
      {id: 2, col1: "Product B", col2: 23000, field_a: "Clothing", misc_data: "Q1-2024", dt: "2024-01-20"},
      {id: 3, col1: "Product A", col2: 18500, field_a: "Electronics", misc_data: "Q2-2024", dt: "2024-04-12"},
      {id: 4, col1: "Product C", col2: 12000, field_a: "Home & Garden", misc_data: "Q2-2024", dt: "2024-05-08"},
      {id: 5, col1: "Product B", col2: 28000, field_a: "Clothing", misc_data: "Q3-2024", dt: "2024-07-22"},
      {id: 6, col1: "Product A", col2: 21000, field_a: "Electronics", misc_data: "Q3-2024", dt: "2024-08-15"}
    ],
    customer_seg: [
      {cust_id: "C001", segment: "Premium", value_score: 85, region_code: "NA", last_active: "2024-08-15"},
      {cust_id: "C002", segment: null, value_score: 42, region_code: "EU", last_active: "2024-06-20"},
      {cust_id: "C003", segment: "Standard", value_score: 67, region_code: "APAC", last_active: null},
      {cust_id: "C004", segment: "Premium", value_score: 92, region_code: "NA", last_active: "2024-09-01"},
      {cust_id: "C005", segment: "Standard", value_score: 58, region_code: "EU", last_active: "2024-08-30"},
      {cust_id: "C006", segment: "Premium", value_score: 78, region_code: "APAC", last_active: "2024-09-10"}
    ]
  }
};

// AI Response Templates
const aiResponses = {
  topProducts: {
    query: "SELECT col1 as product_name, SUM(col2) as total_sales, field_a as category FROM tbl_001 WHERE misc_data LIKE '%2024%' GROUP BY col1, field_a ORDER BY total_sales DESC",
    insight: "Based on analysis of the sales data (table tbl_001), I've identified the top performing products. Despite the poorly named columns (col1=product, col2=sales, field_a=category), I can see that Product A leads with $54,500 in total sales across Electronics, followed by Product B with $51,000 in Clothing. The data shows strong performance in Electronics and Clothing categories.",
    chartType: "bar",
    data: [
      {product: "Product A", sales: 54500, category: "Electronics"},
      {product: "Product B", sales: 51000, category: "Clothing"}, 
      {product: "Product C", sales: 12000, category: "Home & Garden"}
    ],
    followUp: [
      "Show quarterly breakdown for these products",
      "Compare Electronics vs Clothing performance",
      "Analyze seasonal trends in sales data"
    ]
  },
  customerAnalysis: {
    query: "SELECT segment, AVG(value_score) as avg_score, COUNT(*) as customer_count, region_code FROM customer_seg WHERE segment IS NOT NULL GROUP BY segment, region_code ORDER BY avg_score DESC",
    insight: "Customer segmentation analysis reveals significant insights despite data quality issues. Premium customers have the highest average value score (85), while Standard customers average 62.5. Note: 17% of records have missing segment data, indicating data quality issues that need attention. Regional distribution shows North America leading in Premium segments.",
    chartType: "scatter",
    data: [
      {segment: "Premium", avgScore: 85, count: 3, region: "Mixed"},
      {segment: "Standard", avgScore: 62.5, count: 2, region: "Mixed"}
    ],
    followUp: [
      "Identify customers at risk of churning", 
      "Analyze regional performance differences",
      "Show segment distribution by region"
    ]
  },
  salesTrends: {
    query: "SELECT misc_data as quarter, field_a as category, SUM(col2) as total_sales FROM tbl_001 GROUP BY misc_data, field_a ORDER BY misc_data, total_sales DESC",
    insight: "Sales trend analysis across quarters shows interesting patterns. Electronics maintains steady growth from Q1 ($15K) to Q3 ($21K), while Clothing shows volatility with a peak in Q1 ($23K) and strong recovery in Q3 ($28K). Home & Garden appears only in Q2 with $12K, suggesting seasonal or inventory issues.",
    chartType: "line",
    data: [
      {quarter: "Q1-2024", electronics: 15000, clothing: 23000, homeGarden: 0},
      {quarter: "Q2-2024", electronics: 18500, clothing: 0, homeGarden: 12000},
      {quarter: "Q3-2024", electronics: 21000, clothing: 28000, homeGarden: 0}
    ],
    followUp: [
      "Predict Q4 performance based on trends",
      "Analyze seasonal patterns in detail",
      "Compare category performance metrics"
    ]
  },
  revenueDistribution: {
    query: "SELECT field_a as category, SUM(col2) as total_revenue, ROUND(SUM(col2) * 100.0 / (SELECT SUM(col2) FROM tbl_001), 2) as percentage FROM tbl_001 GROUP BY field_a ORDER BY total_revenue DESC",
    insight: "Revenue distribution across categories shows Electronics leading with $54,500 (45.4%), followed by Clothing at $51,000 (42.5%), and Home & Garden at $12,000 (10%). This indicates a well-balanced portfolio with Electronics and Clothing being primary revenue drivers. The Home & Garden category may need strategic attention.",
    chartType: "pie",
    data: [
      {category: "Electronics", revenue: 54500, percentage: 45.4},
      {category: "Clothing", revenue: 51000, percentage: 42.5},
      {category: "Home & Garden", revenue: 12000, percentage: 10.0}
    ],
    followUp: [
      "Analyze profitability by category",
      "Show category growth rates",
      "Identify expansion opportunities"
    ]
  }
};

// Global variables
let currentChart = null;
let conversationHistory = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
});

function setupEventListeners() {
  const chatInput = document.getElementById('chat-input');
  chatInput.addEventListener('keypress', handleKeyPress);
}

function toggleSchema() {
  const schemaContent = document.getElementById('schema-content');
  const toggleBtn = document.getElementById('schema-toggle');
  
  if (schemaContent.classList.contains('hidden')) {
    schemaContent.classList.remove('hidden');
    toggleBtn.textContent = 'Hide';
  } else {
    schemaContent.classList.add('hidden');
    toggleBtn.textContent = 'Show';
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function askSampleQuestion(question) {
  const chatInput = document.getElementById('chat-input');
  chatInput.value = question;
  sendMessage();
}

function sendMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addMessage(message, 'user');
  conversationHistory.push({type: 'user', content: message});
  
  // Clear input
  chatInput.value = '';
  
  // Show loading indicator
  showLoadingMessage();
  
  // Simulate AI processing delay
  setTimeout(() => {
    hideLoadingMessage();
    processAIResponse(message);
  }, 1500);
}

function addMessage(content, type, isHTML = false) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}-message`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (isHTML) {
    contentDiv.innerHTML = content;
  } else {
    contentDiv.textContent = content;
  }
  
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoadingMessage() {
  const chatMessages = document.getElementById('chat-messages');
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message agent-message';
  loadingDiv.id = 'loading-message';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = `
    <div class="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: var(--color-text-secondary);">
      Analyzing database schema and processing your query...
    </p>
  `;
  
  loadingDiv.appendChild(contentDiv);
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideLoadingMessage() {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

function processAIResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  let response;
  
  // Determine response type based on user message
  if (lowerMessage.includes('top') && lowerMessage.includes('product')) {
    response = aiResponses.topProducts;
  } else if (lowerMessage.includes('customer') && (lowerMessage.includes('segment') || lowerMessage.includes('value'))) {
    response = aiResponses.customerAnalysis;
  } else if (lowerMessage.includes('trend') || lowerMessage.includes('region')) {
    response = aiResponses.salesTrends;
  } else if (lowerMessage.includes('revenue') || lowerMessage.includes('distribution') || lowerMessage.includes('categor')) {
    response = aiResponses.revenueDistribution;
  } else {
    // Default general response
    response = generateGeneralResponse(userMessage);
  }
  
  displayAIResponse(response, userMessage);
}

function generateGeneralResponse(userMessage) {
  return {
    query: "-- AI Agent analyzing your query against available schema\nSELECT * FROM tbl_001 t1 \nJOIN customer_seg c ON t1.id = c.cust_id \nWHERE <conditions_based_on_query>",
    insight: `I understand you're asking about "${userMessage}". Based on the available data in our messy database (tbl_001 for sales data and customer_seg for customer information), I can help analyze this question. However, I need to work around several data quality issues including unclear column names, missing values, and inconsistent formatting. Let me know if you'd like me to focus on a specific aspect like sales performance, customer analysis, or trends.`,
    chartType: null,
    data: null,
    followUp: [
      "Show me the top performing products",
      "Analyze customer segments by value score", 
      "Display sales trends by category",
      "Break down revenue distribution"
    ]
  };
}

function displayAIResponse(response, originalQuery) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message agent-message';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  let htmlContent = `
    <h4>Analysis Complete 🔍</h4>
    <p>${response.insight}</p>
    
    <div class="sql-query">
      <strong>Generated SQL:</strong><br>
      <code>${response.query}</code>
    </div>
  `;
  
  if (response.data && response.chartType) {
    htmlContent += `<div class="chart-container" id="chart-container-${Date.now()}"></div>`;
  }
  
  if (response.data && response.chartType !== 'pie') {
    htmlContent += generateDataTable(response.data, response.chartType);
  }
  
  htmlContent += `
    <div class="insights-section">
      <h5>🎯 Key Insights</h5>
      <p>Despite data quality challenges (unclear column names, missing values), the AI agent successfully interpreted your query and extracted meaningful business insights from the available data.</p>
    </div>
  `;
  
  if (response.followUp) {
    htmlContent += `
      <div class="follow-up-suggestions">
        <h5>💡 Suggested follow-up questions:</h5>
        <div class="follow-up-buttons">
          ${response.followUp.map(suggestion => 
            `<button class="btn btn--outline follow-up-btn" onclick="askSampleQuestion('${suggestion}')">${suggestion}</button>`
          ).join('')}
        </div>
      </div>
    `;
  }
  
  contentDiv.innerHTML = htmlContent;
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  
  // Generate chart if data is available
  if (response.data && response.chartType) {
    setTimeout(() => {
      const chartContainer = contentDiv.querySelector('.chart-container');
      if (chartContainer) {
        generateChart(chartContainer, response);
      }
    }, 100);
  }
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Store in conversation history
  conversationHistory.push({type: 'agent', content: response, originalQuery: originalQuery});
}

function generateDataTable(data, chartType) {
  if (!data || !Array.isArray(data)) return '';
  
  let tableHTML = '<div class="data-table"><table>';
  
  if (chartType === 'bar') {
    tableHTML += `
      <thead>
        <tr>
          <th>Product</th>
          <th>Total Sales</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
    `;
    data.forEach(item => {
      tableHTML += `
        <tr>
          <td>${item.product}</td>
          <td>$${item.sales.toLocaleString()}</td>
          <td>${item.category}</td>
        </tr>
      `;
    });
  } else if (chartType === 'scatter') {
    tableHTML += `
      <thead>
        <tr>
          <th>Segment</th>
          <th>Avg Value Score</th>
          <th>Customer Count</th>
        </tr>
      </thead>
      <tbody>
    `;
    data.forEach(item => {
      tableHTML += `
        <tr>
          <td>${item.segment}</td>
          <td>${item.avgScore}</td>
          <td>${item.count}</td>
        </tr>
      `;
    });
  } else if (chartType === 'line') {
    tableHTML += `
      <thead>
        <tr>
          <th>Quarter</th>
          <th>Electronics</th>
          <th>Clothing</th>
          <th>Home & Garden</th>
        </tr>
      </thead>
      <tbody>
    `;
    data.forEach(item => {
      tableHTML += `
        <tr>
          <td>${item.quarter}</td>
          <td>$${item.electronics.toLocaleString()}</td>
          <td>$${item.clothing.toLocaleString()}</td>
          <td>$${item.homeGarden.toLocaleString()}</td>
        </tr>
      `;
    });
  }
  
  tableHTML += '</tbody></table></div>';
  return tableHTML;
}

function generateChart(container, response) {
  if (currentChart) {
    currentChart.destroy();
  }
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
  
  let chartConfig;
  
  switch (response.chartType) {
    case 'bar':
      chartConfig = {
        type: 'bar',
        data: {
          labels: response.data.map(item => item.product),
          datasets: [{
            label: 'Total Sales ($)',
            data: response.data.map(item => item.sales),
            backgroundColor: colors.slice(0, response.data.length),
            borderColor: colors.slice(0, response.data.length),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Top Performing Products by Sales'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      };
      break;
      
    case 'pie':
      chartConfig = {
        type: 'pie',
        data: {
          labels: response.data.map(item => item.category),
          datasets: [{
            data: response.data.map(item => item.revenue),
            backgroundColor: colors.slice(0, response.data.length),
            borderColor: colors.slice(0, response.data.length),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Revenue Distribution by Category'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const item = response.data[context.dataIndex];
                  return `${item.category}: $${item.revenue.toLocaleString()} (${item.percentage}%)`;
                }
              }
            }
          }
        }
      };
      break;
      
    case 'line':
      chartConfig = {
        type: 'line',
        data: {
          labels: response.data.map(item => item.quarter),
          datasets: [
            {
              label: 'Electronics',
              data: response.data.map(item => item.electronics),
              borderColor: colors[0],
              backgroundColor: colors[0] + '20',
              tension: 0.4
            },
            {
              label: 'Clothing', 
              data: response.data.map(item => item.clothing),
              borderColor: colors[1],
              backgroundColor: colors[1] + '20',
              tension: 0.4
            },
            {
              label: 'Home & Garden',
              data: response.data.map(item => item.homeGarden),
              borderColor: colors[2],
              backgroundColor: colors[2] + '20',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Sales Trends by Category Over Time'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        }
      };
      break;
      
    case 'scatter':
      chartConfig = {
        type: 'scatter',
        data: {
          datasets: response.data.map((item, index) => ({
            label: item.segment,
            data: [{
              x: item.count,
              y: item.avgScore
            }],
            backgroundColor: colors[index],
            borderColor: colors[index],
            pointRadius: 8
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Customer Segments: Value Score vs Count'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Customer Count'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Average Value Score'
              }
            }
          }
        }
      };
      break;
  }
  
  if (chartConfig) {
    currentChart = new Chart(ctx, chartConfig);
  }
}