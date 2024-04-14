import { Trans } from "@lingui/macro";
import { Button, Result } from "antd";
import { useNavigate, useRouteError } from "react-router-dom";

export const ErrorBoundary = () => {
  const error: any = useRouteError();
  const navigate = useNavigate();
  if (error.status === 404) {
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <Result
          status="error"
          title={<Trans>未找到页面</Trans>}
          extra={[
            <Button type="primary" onClick={() => navigate("/")} key="console">
              <Trans>返回主页</Trans>
            </Button>,
          ]}
        />
      </div>
    );
  }
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <Result
        status="error"
        title={<Trans>未知错误</Trans>}
        extra={[
          <Button type="primary" onClick={() => navigate("/")} key="console">
            <Trans>返回主页</Trans>
          </Button>,
        ]}
      />
    </div>
  );
};
