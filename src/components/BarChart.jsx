
import axios from 'axios';
import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3';


const API_KEY = import.meta.env.VITE_API_KEY;


const BarChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const svgRef = useRef();

    // const isDev = true;
    // useEffect(() => {
    //     if (isDev) {
    //         // 假資料，查看圖表樣式有沒有一樣
    //         const mockData = [
    //             { month: 'EUR', Current: 0.92, Past30Days: 0.91 },
    //             { month: 'GBP', Current: 0.78, Past30Days: 0.79 },
    //             { month: 'AUD', Current: 1.52, Past30Days: 1.55 },
    //             { month: 'CAD', Current: 1.35, Past30Days: 1.34 },
    //             { month: 'CHF', Current: 0.88, Past30Days: 0.89 },
    //             { month: 'USD', Current: 1.00, Past30Days: 1.00 },
    //             { month: 'TWD', Current: 0.88, Past30Days: 0.80 }
    //         ];
    //         setData(mockData);
    //         setLoading(false);
    //         return;
    //     }

    // }, []);

    useEffect(() => {
        const exchangeRates = async () => {
            try {
                const baseCurrency = 'USD';
                const symbols = 'USD,EUR,GBP,AUD,CAD,CHF';

                const config = {
                    headers: {
                        'apikey': API_KEY
                    }
                };

                // 取得今天的匯率
                const todayResponse = await axios.get(
                    `https://api.apilayer.com/exchangerates_data/latest?base=${baseCurrency}&symbols=${symbols}`,
                    config
                );

                // 取得 30 天前的匯率
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const dateString = thirtyDaysAgo.toISOString().split('T')[0];

                const pastResponse = await axios.get(
                    `https://api.apilayer.com/exchangerates_data/${dateString}?base=${baseCurrency}&symbols=${symbols}`,
                    config
                );

                // 將資料轉換成圖表格式
                const chartData = Object.keys(todayResponse.data.rates).map(currency => ({
                    month: currency,
                    Current: todayResponse.data.rates[currency],
                    Past30Days: pastResponse.data.rates[currency]
                }));

                setData(chartData);
                setLoading(false);

            } catch (err) {
                console.error('錯誤:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        exchangeRates();
    }, []);

    useEffect(() => {

        // 驗證圖表
        if (data.length === 0) {
            return
        };

        // 為了避免重複繪製，先清空在繪製
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 700;
        const height = 500;
        const margin = { top: 40, right: 40, bottom: 80, left: 60 };

        // 準備堆疊資料
        const categories = ['Past30Days', 'Current'];
        const stackGenerator = d3.stack().keys(categories);
        const stackedData = stackGenerator(data);

        // X 軸比例尺
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.month))
            .range([margin.left, width - margin.right])
            .padding(0.3);

        // Y 軸比例尺
        const maxValue = d3.max(data, d => d.Current + d.Past30Days);
        const yScale = d3.scaleLinear()
            .domain([0, maxValue])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // 顏色比例尺
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(['#90C695', '#6FA8DC']); // 綠色（30天前）和藍色（現在）

        // 圖表的橘色外框
        svg.append("rect")
            .attr("x", margin.left - 40)
            .attr("y", margin.top - 20)
            .attr("width", width - margin.left - margin.right + 50)
            .attr("height", height - margin.top - margin.bottom + 50)
            .attr("fill", "none")
            .attr("stroke", "#FF9933")
            .attr("stroke-width", 3)
            .attr("rx", 15);  // 圓角


        // 新增：繪製水平虛線（Grid Lines）
        const yAxisGrid = d3.axisLeft(yScale)
            .tickSize(-(width - margin.left - margin.right))  // 負數讓線往右延伸
            .tickFormat('');  // 不顯示刻度文字

        svg.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(${margin.left},0)`)
            .call(yAxisGrid)
            .selectAll('line')
            .attr('stroke', '#e0e0e0')  // 淡灰色
            .attr('stroke-dasharray', '3,3')  // 虛線樣式 (3px 實線, 3px 空白)
            .attr('stroke-width', 1);

        // 移除 grid 的主軸線
        svg.select('.grid .domain').remove();

        // 繪製堆疊長條圖
        svg.selectAll("g.layer")
            .data(stackedData)
            .join("g")
            .attr("class", "layer")
            .attr("fill", d => colorScale(d.key))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => xScale(d.data.month))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth());

        // X 軸
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("font-size", "12px");

        // Y 軸
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));

        // 將所有座標軸線條變細
        svg.selectAll(".domain")
            .attr("stroke-width", 0.5);

        svg.selectAll(".tick line")
            .attr("stroke-width", 0.5);

        // 圖表標題
        svg.append("text")
            .attr("x", width - 80)
            .attr("y", height / 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .text("圖表");

        // 圖例位置
        const legendX = width / 2 - 100;
        const legendY = height - margin.bottom + 30;

        // 圖例的橘色框
        svg.append("rect")
            .attr("x", legendX - 15)
            .attr("y", legendY + 10)
            .attr("width", 180)
            .attr("height", 35)
            .attr("fill", "none")
            .attr("stroke", "#FF9933")
            .attr("stroke-width", 2)
            .attr("rx", 18);  // 圓角

        // 圖例 - 30 天前
        svg.append("rect")
            .attr("x", legendX)
            .attr("y", legendY + 18)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorScale('Past30Days'));

        svg.append("text")
            .attr("x", legendX + 20)
            .attr("y", legendY + 30)
            .attr("font-size", "12px")
            .text("30 天前");

        // 圖例 - 現在
        svg.append("rect")
            .attr("x", legendX + 100)
            .attr("y", legendY + 18)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colorScale('Current'));

        svg.append("text")
            .attr("x", legendX + 120)
            .attr("y", legendY + 30)
            .attr("font-size", "12px")
            .text("現在");

        // 圖例標題
        svg.append("text")
            .attr("x", width - 80)
            .attr("y", legendY + 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text("圖例");

    }, [data]);

    if (loading) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>載入中...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h3>錯誤: {error}</h3>
                <p>請確認:</p>
                <ul>
                    <li>已註冊 APILayer 帳號並取得 API Key</li>
                </ul>
            </div>
        );
    }
    return (<>
        <svg ref={svgRef} width={700} height={500}></svg>
    </>
    )
}

export default BarChart