// src/components/Dashboard.jsx - Updated with new PDF download functionality
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Dashboard.css';
import domtoimage from 'dom-to-image';
import { jsPDF } from 'jspdf';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFruits: 0,
    gradeA: 0,
    gradeB: 0,
    gradeC: 0,
    gradeE: 0,
    gradeF: 0,
    acceptanceRate: 0,
    rejectionRate: 0,
    fruitTypes: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  useEffect(() => {
    // Fetch fruits data to calculate stats
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:3001/api/fruits');
        const fruits = response.data;
        
        const totalFruits = fruits.length;
        const gradeA = fruits.filter(fruit => fruit.grade === 'A').length;
        const gradeB = fruits.filter(fruit => fruit.grade === 'B').length;
        const gradeC = fruits.filter(fruit => fruit.grade === 'C').length;
        const gradeE = fruits.filter(fruit => fruit.grade === 'E').length;
        const gradeF = fruits.filter(fruit => fruit.grade === 'F').length;
        
        const accepted = gradeA + gradeB + gradeC;
        const rejected = gradeE + gradeF;
        const acceptanceRate = totalFruits > 0 ? (accepted / totalFruits) * 100 : 0;
        const rejectionRate = totalFruits > 0 ? (rejected / totalFruits) * 100 : 0;
        
        // Get fruit type statistics
        const types = {};
        fruits.forEach(fruit => {
          if (!fruit.name) return;
          
          const name = fruit.name.toLowerCase();
          if (!types[name]) {
            types[name] = {
              name: fruit.name,
              count: 0,
              gradeA: 0,
              gradeB: 0,
              gradeC: 0,
              gradeE: 0,
              gradeF: 0
            };
          }
          
          types[name].count += 1;
          
          if (fruit.grade === 'A') types[name].gradeA += 1;
          else if (fruit.grade === 'B') types[name].gradeB += 1;
          else if (fruit.grade === 'C') types[name].gradeC += 1;
          else if (fruit.grade === 'E') types[name].gradeE += 1;
          else if (fruit.grade === 'F') types[name].gradeF += 1;
        });
        
        const fruitTypes = Object.values(types)
          .map(type => ({
            ...type,
            acceptanceRate: type.count > 0 ? 
              ((type.gradeA + type.gradeB + type.gradeC) / type.count) * 100 : 0,
            excellenceRate: type.count > 0 ? 
              (type.gradeA / type.count) * 100 : 0,
            rejectionRate: type.count > 0 ? 
              ((type.gradeE + type.gradeF) / type.count) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count);
        
        setStats({
          totalFruits,
          gradeA,
          gradeB,
          gradeC,
          gradeE,
          gradeF,
          acceptanceRate,
          rejectionRate,
          fruitTypes
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching stats data:', error);
        setError('Failed to load data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Function to get fruit icon based on fruit name
  const getFruitIcon = (fruitName) => {
    const name = fruitName.toLowerCase();
    if (name.includes('apple')) return '🍎';
    if (name.includes('orange')) return '🍊';
    if (name.includes('banana')) return '🍌';
    if (name.includes('cherry')) return '🍒';
    if (name.includes('strawberry')) return '🍓';
    if (name.includes('grape')) return '🍇';
    if (name.includes('mango')) return '🥭';
    if (name.includes('pear')) return '🍐';
    if (name.includes('peach')) return '🍑';
    if (name.includes('lemon')) return '🍋';
    if (name.includes('watermelon')) return '🍉';
    if (name.includes('delum')) return '🍎'; // Pomegranate (using apple as fallback since pomegranate emoji isn't widely supported)
    return '🍏'; // Default fruit icon
  };

  // Function to get fruit color based on fruit name
  const getFruitColor = (fruitName) => {
    const name = fruitName.toLowerCase();
    if (name.includes('apple')) return '#ff5e5e';
    if (name.includes('orange')) return '#ffa500';
    if (name.includes('banana')) return '#ffe135';
    if (name.includes('cherry')) return '#c94057';
    if (name.includes('strawberry')) return '#ff3860';
    if (name.includes('grape')) return '#6f2da8';
    if (name.includes('mango')) return '#ffbe0b';
    if (name.includes('pear')) return '#d1e231';
    if (name.includes('peach')) return '#ffcba4';
    if (name.includes('lemon')) return '#fff44f';
    if (name.includes('watermelon')) return '#fc6c85';
    if (name.includes('delum')) return '#c32148'; // Pomegranate dark red color
    return '#a4bc5a'; // Default fruit color
  };

  // Function to get grade indicator color
  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return '#10B981';
      case 'B': return '#38B2AC';
      case 'C': return '#f2cf4a';
      case 'E': return '#f56565';
      case 'F': return '#b43b3b';
      default: return '#ccc';
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/fruits/");
        const data = response.data;
  
        setFruitData(data);
  
        const total = data.length;
        const accepted = data.filter(fruit => ['A', 'B', 'C'].includes(fruit.grade)).length;
        const rejected = data.filter(fruit => ['E', 'F'].includes(fruit.grade)).length;
  
        setTotalFruits(total);
        setAcceptedFruits(accepted);
        setRejectedFruits(rejected);
  
        const grades = {};
        data.forEach(fruit => {
          grades[fruit.grade] = (grades[fruit.grade] || 0) + 1;
        });
        setFruitGrades(grades);
      } catch (error) {
        console.error("Error fetching fruit data:", error);
      }
    };
  
    fetchData();
  }, []);

  const calculateFruitTypes = () => {
    const types = {};
  
    fruitData.forEach(fruit => {
      const type = fruit.fruitType;
      if (!types[type]) {
        types[type] = { total: 0, accepted: 0, rejected: 0, excellent: 0 };
      }
      types[type].total++;
  
      if (['A', 'B', 'C'].includes(fruit.grade)) types[type].accepted++;
      if (['E', 'F'].includes(fruit.grade)) types[type].rejected++;
      if (fruit.grade === 'A') types[type].excellent++;
    });
  
    setFruitTypes(types);
  };
  
  

  // New PDF download function using dom-to-image and jsPDF
  const handleDownloadPDF = async () => {
    setIsPdfGenerating(true);
    
    try {
      // Get the element to capture
      const element = document.getElementById('dashboard-content');
      
      // Generate a PNG image of the entire content
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1.0,
        bgcolor: '#ffffff',
        style: {
          padding: '20px'
        }
      });
      
      // Create a new image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      // Create PDF with A4 size
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions to fit image on A4
      const imgWidth = 210; // A4 width (mm)
      const imgHeight = img.height * imgWidth / img.width;
      const pageHeight = 297; // A4 height (mm)
      
      // Calculate how many pages we need
      const pageCount = Math.ceil(imgHeight / pageHeight);
      
      // Add image to each page with proper positioning
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = -pageHeight * (pageCount - heightLeft / pageHeight);
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Function to add headers and footers
      const addHeadersAndFooters = () => {
        const totalPages = pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          
          // Header
          pdf.setFontSize(16);
          pdf.setTextColor(164, 188, 90); // Green color
          pdf.text('Fruit Management System - Analytics Dashboard', 105, 15, { align: 'center' });
          
          // Date
          const today = new Date();
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Report generated on: ${today.toLocaleDateString()}`, 20, 25);
          
          // Footer
          pdf.setFontSize(10);
          pdf.text(`Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
        }
      };
      
      // Add headers and footers
      addHeadersAndFooters();
      
      // Save the PDF
      pdf.save('report.pdf');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="dashboard-loading">Loading dashboard data...</div>;
  }
  
  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Fruit Grading Analytics Dashboard</h2>
        <button 
          id="download-pdf-btn" 
          className="download-pdf-button" 
          onClick={handleDownloadPDF}
          disabled={isPdfGenerating}
        >
          {isPdfGenerating ? 'Generating PDF...' : 'Save PDF'}
        </button>
      </div>
      
      {/* Wrap all content that should be in the PDF in this div */}
      <div id="dashboard-content">
        {/* Quality Grading Scale Legend */}
        <div className="grade-scale-section">
          <div className="grade-scale-title">Quality Grading Scale</div>
          <div className="grade-badges">
            <div className="grade-badge-item">
              <span className="grade-badge-color grade-a"></span>
              <span className="grade-badge-text">A - Excellent</span>
            </div>
            <div className="grade-badge-item">
              <span className="grade-badge-color grade-b"></span>
              <span className="grade-badge-text">B - Good</span>
            </div>
            <div className="grade-badge-item">
              <span className="grade-badge-color grade-c"></span>
              <span className="grade-badge-text">C - Normal</span>
            </div>
            <div className="grade-badge-item">
              <span className="grade-badge-color grade-e"></span>
              <span className="grade-badge-text">E - Bad (Rejected)</span>
            </div>
            <div className="grade-badge-item">
              <span className="grade-badge-color grade-f"></span>
              <span className="grade-badge-text">F - Very Bad (Rejected)</span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">🍎</div>
            <h3>Total Fruits</h3>
            <div className="stat-value">{stats.totalFruits}</div>
          </div>
          
          <div className="stat-card grade-a">
            <div className="stat-icon">🏆</div>
            <h3>Grade A (Excellent)</h3>
            <div className="stat-value">{stats.gradeA}</div>
            <div className="stat-percentage">
              {stats.totalFruits > 0 ? ((stats.gradeA / stats.totalFruits) * 100).toFixed(1) : 0}%
            </div>
          </div>
          
          <div className="stat-card grade-b">
            <div className="stat-icon">🥈</div>
            <h3>Grade B (Good)</h3>
            <div className="stat-value">{stats.gradeB}</div>
            <div className="stat-percentage">
              {stats.totalFruits > 0 ? ((stats.gradeB / stats.totalFruits) * 100).toFixed(1) : 0}%
            </div>
          </div>
          
          <div className="stat-card grade-c">
            <div className="stat-icon">🍊</div>
            <h3>Grade C (Normal)</h3>
            <div className="stat-value">{stats.gradeC}</div>
            <div className="stat-percentage">
              {stats.totalFruits > 0 ? ((stats.gradeC / stats.totalFruits) * 100).toFixed(1) : 0}%
            </div>
          </div>
          
          <div className="stat-card grade-e">
            <div className="stat-icon">⚠️</div>
            <h3>Grade E (Bad)</h3>
            <div className="stat-value">{stats.gradeE}</div>
            <div className="stat-percentage">
              {stats.totalFruits > 0 ? ((stats.gradeE / stats.totalFruits) * 100).toFixed(1) : 0}%
            </div>
          </div>
          
          <div className="stat-card grade-f">
            <div className="stat-icon">❌</div>
            <h3>Grade F (Very Bad)</h3>
            <div className="stat-value">{stats.gradeF}</div>
            <div className="stat-percentage">
              {stats.totalFruits > 0 ? ((stats.gradeF / stats.totalFruits) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
        
        {/* Acceptance vs Rejection Rate */}
        <div className="acceptance-section">
          <h3>Acceptance vs Rejection Rate</h3>
          <div className="acceptance-stats">
            <div>{stats.acceptanceRate.toFixed(1)}% Accepted</div>
            <div>{stats.rejectionRate.toFixed(1)}% Rejected</div>
          </div>
          <div className="acceptance-description">
            {stats.acceptanceRate.toFixed(1)}% of fruits are acceptable quality (A, B, C grades)
          </div>
          
          {/* Grade Progress Bars */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-bar-grade grade-a" 
                style={{ width: `${stats.totalFruits > 0 ? (stats.gradeA / stats.totalFruits) * 100 : 0}%` }}
              >
                A
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-grade grade-b" 
                style={{ width: `${stats.totalFruits > 0 ? (stats.gradeB / stats.totalFruits) * 100 : 0}%` }}
              >
                B
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-grade grade-c" 
                style={{ width: `${stats.totalFruits > 0 ? (stats.gradeC / stats.totalFruits) * 100 : 0}%` }}
              >
                C
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-grade grade-e" 
                style={{ width: `${stats.totalFruits > 0 ? (stats.gradeE / stats.totalFruits) * 100 : 0}%` }}
              >
                E
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-grade grade-f" 
                style={{ width: `${stats.totalFruits > 0 ? (stats.gradeF / stats.totalFruits) * 100 : 0}%` }}
              >
                F
              </div>
            </div>
          </div>
        </div>
        
        {/* Fruit Types Breakdown - ENHANCED */}
        {stats.fruitTypes.length > 0 && (
          <div className="fruit-types-section">
            <h2 className="fruit-types-title">Fruit Types Breakdown</h2>
            
            <div className="fruit-types-grid">
              {stats.fruitTypes.map((type, index) => {
                const fruitColor = getFruitColor(type.name);
                const fruitIcon = getFruitIcon(type.name);
                
                return (
                  <div key={index} className="fruit-type-card" style={{'--fruit-color': fruitColor}}>
                    <div className="fruit-card-header">
                      <div className="fruit-icon">{fruitIcon}</div>
                      <div className="fruit-type-name">{type.name}</div>
                      <div className="fruit-count">{type.count} fruits</div>
                    </div>
                    
                    <div className="quality-breakdown">
                      {type.gradeA > 0 && (
                        <div className="quality-item">
                          <div className="quality-indicator" style={{backgroundColor: getGradeColor('A')}}>A</div>
                          <div className="quality-count">{type.gradeA}</div>
                        </div>
                      )}
                      {type.gradeB > 0 && (
                        <div className="quality-item">
                          <div className="quality-indicator" style={{backgroundColor: getGradeColor('B')}}>B</div>
                          <div className="quality-count">{type.gradeB}</div>
                        </div>
                      )}
                      {type.gradeC > 0 && (
                        <div className="quality-item">
                          <div className="quality-indicator" style={{backgroundColor: getGradeColor('C')}}>C</div>
                          <div className="quality-count">{type.gradeC}</div>
                        </div>
                      )}
                      {type.gradeE > 0 && (
                        <div className="quality-item">
                          <div className="quality-indicator" style={{backgroundColor: getGradeColor('E')}}>E</div>
                          <div className="quality-count">{type.gradeE}</div>
                        </div>
                      )}
                      {type.gradeF > 0 && (
                        <div className="quality-item">
                          <div className="quality-indicator" style={{backgroundColor: getGradeColor('F')}}>F</div>
                          <div className="quality-count">{type.gradeF}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="fruit-metrics">
                      <div className="acceptance-metric">
                        <div className="metric-label">Acceptance Rate</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill acceptance-fill" 
                            style={{width: `${type.acceptanceRate}%`}}
                          ></div>
                        </div>
                        <div className="metric-value">{type.acceptanceRate.toFixed(1)}%</div>
                      </div>
                      
                      <div className="excellence-metric">
                        <div className="metric-label">Excellence Rate</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill excellence-fill" 
                            style={{width: `${type.excellenceRate}%`}}
                          ></div>
                        </div>
                        <div className="metric-value">{type.excellenceRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;