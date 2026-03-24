import { OrchestrationConfig } from '../orchestrator/types';

export const mockConfig: OrchestrationConfig = {
  steps: [
    {
      id: 'basic-info',
      title: '基础信息',
      components: [
        {
          type: 'Title',
          props: { level: 4, children: '1. 活动基本信息' }
        },
        {
          type: 'FormItem',
          props: { label: '活动名称', name: 'activityName' },
          children: [
            {
              type: 'Input',
              props: { placeholder: '请输入活动名称' }
            }
          ]
        },
        {
          type: 'FormItem',
          props: { label: '活动类型', name: 'activityType' },
          children: [
            {
              type: 'Select',
              props: {
                style: { width: '100%' },
                placeholder: '请选择',
                options: [
                  { label: '线上活动', value: 'online' },
                  { label: '线下活动', value: 'offline' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'dynamic-props',
      title: '动态属性',
      components: [
        {
          type: 'Title',
          props: { level: 4, children: '2. 动态属性演示' }
        },
        {
          type: 'Card',
          dynamicProps: `function(context) {
            return {
              title: context.activityName ? '正在编辑: ' + context.activityName : '请先在第一步输入名称',
              style: { 
                backgroundColor: context.activityType === 'online' ? '#e6f7ff' : '#fff1f0',
                borderColor: context.activityType === 'online' ? '#91d5ff' : '#ffa39e'
              }
            };
          }`,
          children: [
            {
              type: 'FormItem',
              dynamicProps: `function(context) {
                return {
                  label: context.activityType === 'online' ? '会议链接' : '签到地址'
                };
              }`,
              children: [
                {
                  type: 'Input',
                  dynamicProps: `function(context) {
                    return {
                      placeholder: context.activityType === 'online' ? '请输入线上会议 URL' : '请输入线下活动具体地址',
                      prefix: context.activityType === 'online' ? '🌐' : '📍'
                    };
                  }`
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'preview',
      title: '确认提交',
      components: [
        {
          type: 'Title',
          props: { level: 4, children: '3. 预览并确认' }
        },
        {
          type: 'Card',
          props: { title: '汇总信息' },
          children: [
            {
              type: 'Row',
              children: [
                {
                  type: 'Col',
                  props: { span: 24 },
                  children: [
                    {
                      type: 'Title',
                      dynamicProps: `function(context) {
                        return {
                          level: 5,
                          children: '活动名称：' + (context.activityName || '未填写')
                        };
                      }`
                    },
                    {
                      type: 'Title',
                      dynamicProps: `function(context) {
                        return {
                          level: 5,
                          children: '活动类型：' + (context.activityType === 'online' ? '线上' : '线下')
                        };
                      }`
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
