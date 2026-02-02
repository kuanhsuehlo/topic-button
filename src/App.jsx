import { useState } from 'react'
import { Button, ButtonGroup, Container } from '@mui/material'

import BarChart from './components/BarChart';

function App() {
  const [count, setCount] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false)





  // 增加按鈕
  const handleIncrement = () => setCount((pre) => pre + 1)
  // reset按鈕
  const handleReset = () => setCount(0)
  // 切換關閉開啟
  const toggleDisabled = () => setIsDisabled(!isDisabled)




  return (<>
    <h2>1	.請使⽤	Material-UI	中的	Button	group，做出三個按鈕 (使⽤Redux 加分)。</h2>
    <ButtonGroup variant="outlined"
      orientation="vertical"
      aria-label="outlined primary button group">
      <Button onClick={handleIncrement} disabled={isDisabled}>Click:{count}</Button>
      <Button onClick={handleReset}>Clear</Button>
      <Button variant="outlined" onClick={toggleDisabled}>
        {isDisabled ? 'Enable' : 'Disable'}
      </Button>
    </ButtonGroup>
    <h2>2. 請使⽤任⼀套件，做出以下圖表，資料部分請拉取公開API	(e.g.	https://any-api.com/	)</h2>
    <BarChart />
  </>)
}

export default App
